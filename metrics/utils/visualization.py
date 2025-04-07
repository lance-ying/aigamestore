import os
import logging
from typing import Dict, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# Try importing visualization libraries, but allow the script to run without them.
try:
    import networkx as nx
    import matplotlib.pyplot as plt

    VISUALIZATION_ENABLED = True
except ImportError:
    logging.warning("NetworkX or Matplotlib not found. Visualization will be disabled.")
    VISUALIZATION_ENABLED = False


def create_ecs_graph(ecs_results: Dict) -> Optional[nx.DiGraph]:
    """
    Creates a networkx graph from the analyzed ECS structure.
    
    Args:
        ecs_results: Dictionary containing the ECS analysis results
        
    Returns:
        NetworkX directed graph or None if visualization is not enabled
    """
    if not VISUALIZATION_ENABLED:
        logging.warning("Cannot create graph: Visualization libraries not available")
        return None
        
    graph = nx.DiGraph()

    # Add nodes for components
    for comp_name, props in ecs_results.get("components", {}).items():
        # label = f"{comp_name}\n({', '.join(props)})" if props else comp_name
        graph.add_node(
            comp_name, type="component", label=comp_name
        )  # Keep label simple for now

    # Add nodes for entity types
    for entity_name, components in ecs_results.get("entities", {}).items():
        # label = f"{entity_name}\n[{', '.join(components)}]" if components else entity_name
        graph.add_node(entity_name, type="entity", label=entity_name)
        # Add "has" relationship edges
        for comp_name in components:
            if graph.has_node(comp_name):  # Only add edge if component node exists
                graph.add_edge(entity_name, comp_name, type="has")
            else:
                logging.warning(
                    f"Graph: Component node '{comp_name}' not found for entity '{entity_name}'."
                )

    # Add nodes for systems and dependency edges
    for sys_name, deps in ecs_results.get("systems", {}).items():
        graph.add_node(sys_name, type="system", label=sys_name)
        # Add "reads" relationship edges
        for comp_name in deps.get("reads", []):
            if graph.has_node(comp_name):
                graph.add_edge(comp_name, sys_name, type="read_by")
            else:
                logging.warning(
                    f"Graph: Component node '{comp_name}' not found for system '{sys_name}' (read)."
                )
        # Add "writes" relationship edges
        for comp_name in deps.get("writes", []):
            if graph.has_node(comp_name):
                graph.add_edge(sys_name, comp_name, type="writes_to")
            else:
                logging.warning(
                    f"Graph: Component node '{comp_name}' not found for system '{sys_name}' (write)."
                )

    return graph


def visualize_ecs_graph(graph: nx.DiGraph, output_path: str) -> bool:
    """
    Visualizes the ECS graph using Matplotlib and saves it.
    
    Args:
        graph: NetworkX directed graph to visualize
        output_path: Path to save the output image
        
    Returns:
        True if visualization was successful, False otherwise
    """
    if not VISUALIZATION_ENABLED:
        logging.warning(
            "Visualization libraries not available. Skipping graph generation."
        )
        return False

    if graph is None or graph.number_of_nodes() == 0:
        logging.warning("Graph is empty or None, cannot visualize.")
        return False
        
    try:
        plt.figure(figsize=(18, 12))  # Adjust figure size for potentially large graphs
        plt.title("ECS Architecture")

        # Use a layout algorithm that handles larger graphs better
        try:
            # Increase iterations for potentially better layout, k controls distance
            pos = nx.spring_layout(graph, k=0.5, iterations=50, seed=42)
        except Exception as layout_err:
            logging.error(
                f"Graph layout failed: {layout_err}. Falling back to random layout."
            )
            pos = nx.random_layout(graph, seed=42)  # Fallback layout

        node_colors = []
        node_sizes = []
        node_shapes = []  # Store shapes as well

        type_map = {
            "component": ("lightblue", 500, "s"),  # Square
            "entity": ("lightgreen", 700, "o"),  # Circle
            "system": ("lightcoral", 700, "d"),
        }  # Diamond

        for node in graph.nodes():
            node_type = graph.nodes[node].get("type", "unknown")
            color, size, shape = type_map.get(
                node_type, ("gray", 400, "h")
            )  # Hexagon for unknown
            node_colors.append(color)
            node_sizes.append(size)
            node_shapes.append(shape)  # Append shape marker

        # Draw nodes with different shapes - requires iterating through unique shapes
        unique_shapes = set(node_shapes)
        for shape in unique_shapes:
            nodelist = [
                node for i, node in enumerate(graph.nodes()) if node_shapes[i] == shape
            ]
            colors = [
                node_colors[i]
                for i, node in enumerate(graph.nodes())
                if node_shapes[i] == shape
            ]
            sizes = [
                node_sizes[i]
                for i, node in enumerate(graph.nodes())
                if node_shapes[i] == shape
            ]

            nx.draw_networkx_nodes(
                graph,
                pos,
                nodelist=nodelist,
                node_color=colors,
                node_size=sizes,
                node_shape=shape,
                alpha=0.8,
            )

        # Draw edges with different styles or labels based on type
        edge_colors = {"has": "gray", "read_by": "blue", "writes_to": "red"}
        edge_styles = {"has": "dotted", "read_by": "solid", "writes_to": "dashed"}

        for u, v, data in graph.edges(data=True):
            edge_type = data.get("type", "unknown")
            color = edge_colors.get(edge_type, "black")
            style = edge_styles.get(edge_type, "solid")
            nx.draw_networkx_edges(
                graph,
                pos,
                edgelist=[(u, v)],
                edge_color=color,
                style=style,
                alpha=0.6,
                arrows=True,
            )

        # Draw labels (adjust font size)
        labels = {node: graph.nodes[node].get("label", node) for node in graph.nodes()}
        nx.draw_networkx_labels(graph, pos, labels=labels, font_size=8)

        # Create legend (manually)
        legend_elements = [
            plt.Line2D(
                [0],
                [0],
                marker="s",
                color="w",
                label="Component",
                markerfacecolor="lightblue",
                markersize=10,
            ),
            plt.Line2D(
                [0],
                [0],
                marker="o",
                color="w",
                label="Entity Type",
                markerfacecolor="lightgreen",
                markersize=10,
            ),
            plt.Line2D(
                [0],
                [0],
                marker="d",
                color="w",
                label="System",
                markerfacecolor="lightcoral",
                markersize=10,
            ),
            plt.Line2D(
                [0], [0], color="gray", lw=2, linestyle="dotted", label="Has Component"
            ),
            plt.Line2D([0], [0], color="blue", lw=2, label="Read By System"),
            plt.Line2D(
                [0], [0], color="red", lw=2, linestyle="dashed", label="Writes To Component"
            ),
        ]
        plt.legend(handles=legend_elements, loc="upper right", fontsize="small")

        plt.axis("off")
        plt.tight_layout()
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Save the figure
        plt.savefig(output_path, dpi=150)  # Increase DPI for better quality
        logging.info(f"ECS visualization saved to {output_path}")
        plt.close()  # Close the plot to free memory
        return True
        
    except Exception as e:
        logging.error(f"Failed to generate visualization: {e}", exc_info=True)
        return False 