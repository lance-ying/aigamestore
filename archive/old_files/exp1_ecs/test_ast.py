from dataclasses import dataclass
from typing import List, Dict, Any, Set
import ast
from graphviz import Digraph
import astunparse
from pathlib import Path


@dataclass
class Entity:
    id: str
    components: Set[str]


@dataclass
class Component:
    name: str
    properties: List[str]


@dataclass
class System:
    name: str
    reads: Set[str]  # Components this system reads
    writes: Set[str]  # Components this system modifies


class ECSAnalyzer:
    def __init__(self):
        self.entities = {}
        self.components = {}
        self.systems = {}

    def analyze_js_code(self, js_code: str):
        """Analyze JavaScript code to extract ECS structure"""
        # This would use a JavaScript parser (like esprima) in practice
        # For demonstration, we'll show the structure we'd want to build

        # Example analysis of lone_marksman game:

        # Define components based on entity creation patterns
        # TODO: this should be more general
        self.components = {
            "position": Component(name="position", properties=["x", "y"]),
            "velocity": Component(name="velocity", properties=["x", "y"]),
            "size": Component(name="size", properties=["radius"]),
            "type": Component(name="type", properties=["entityType"]),
        }

        # Define entity types and their components
        self.entities = {
            "player": Entity(
                id="player", components={"position", "velocity", "size", "type"}
            ),
            "bullet": Entity(
                id="bullet",
                components={"position", "velocity", "size", "type", "friendly"},
            ),
            "enemy": Entity(
                id="enemy", components={"position", "velocity", "size", "type"}
            ),
        }

        # Define systems and their component dependencies
        self.systems = {
            "inputSystem": System(
                name="updateInputSystem",
                reads={"position", "type"},
                writes={"velocity"},
            ),
            "movementSystem": System(
                name="updateMovementSystem", reads={"velocity"}, writes={"position"}
            ),
            "collisionSystem": System(
                name="updateCollisionSystem",
                reads={"position", "size", "type", "friendly"},
                writes=set(),  # Only reads components
            ),
            "renderSystem": System(
                name="renderSystem",
                reads={"position", "size", "type"},
                writes=set(),  # Only reads components
            ),
        }

    def generate_ast(self):
        """Generate AST representation of the ECS structure"""
        # Create nodes for each component
        component_nodes = [
            ast.Dict(
                keys=[ast.Str(c.name)],
                values=[
                    ast.List(elts=[ast.Str(p) for p in c.properties], ctx=ast.Load())
                ],
            )
            for c in self.components.values()
        ]

        # Create nodes for each entity
        entity_nodes = [
            ast.Dict(
                keys=[ast.Str(e.id)],
                values=[ast.Set(elts=[ast.Str(c) for c in e.components])],
            )
            for e in self.entities.values()
        ]

        # Create nodes for each system
        system_nodes = [
            ast.Dict(
                keys=[ast.Str(s.name)],
                values=[
                    ast.Dict(
                        keys=[ast.Str("reads"), ast.Str("writes")],
                        values=[
                            ast.Set(elts=[ast.Str(c) for c in s.reads]),
                            ast.Set(elts=[ast.Str(c) for c in s.writes]),
                        ],
                    )
                ],
            )
            for s in self.systems.values()
        ]

        # Create the full AST
        return ast.Module(
            body=[
                ast.Assign(
                    targets=[ast.Name(id="ecs_structure", ctx=ast.Store())],
                    value=ast.Dict(
                        keys=[
                            ast.Str("components"),
                            ast.Str("entities"),
                            ast.Str("systems"),
                        ],
                        values=[
                            ast.List(elts=component_nodes, ctx=ast.Load()),
                            ast.List(elts=entity_nodes, ctx=ast.Load()),
                            ast.List(elts=system_nodes, ctx=ast.Load()),
                        ],
                    ),
                )
            ]
        )


def translate_js_to_ecs_ast(js_code: str) -> ast.AST:
    analyzer = ECSAnalyzer()
    analyzer.analyze_js_code(js_code)
    return analyzer.generate_ast()


def visualize_ecs_ast(ast_tree: ast.AST, output_file: str = "ecs_graph"):
    """
    Creates a visual representation of the ECS structure using graphviz.
    Shows components, entities, and systems with their relationships.
    """
    dot = Digraph(comment="ECS Structure")
    dot.attr(rankdir="TB")  # Top to bottom direction

    # Define node styles
    dot.attr("node", shape="box", style="filled")

    # Create subgraphs for better organization
    with dot.subgraph(name="cluster_components") as c:
        c.attr(label="Components")
        c.attr("node", fillcolor="lightblue")
        for comp_node in ast_tree.body[0].value.values[0].elts:
            comp_name = comp_node.keys[0].s
            props = [p.s for p in comp_node.values[0].elts]
            c.node(f"comp_{comp_name}", f"{comp_name}\n{props}")

    with dot.subgraph(name="cluster_entities") as e:
        e.attr(label="Entities")
        e.attr("node", fillcolor="lightgreen")
        for entity_node in ast_tree.body[0].value.values[1].elts:
            entity_name = entity_node.keys[0].s
            components = [c.s for c in entity_node.values[0].elts]
            e.node(f"entity_{entity_name}", f"{entity_name}\n{components}")
            # Add edges from entities to their components
            for comp in components:
                dot.edge(f"entity_{entity_name}", f"comp_{comp}", "has")

    with dot.subgraph(name="cluster_systems") as s:
        s.attr(label="Systems")
        s.attr("node", fillcolor="lightpink")
        for system_node in ast_tree.body[0].value.values[2].elts:
            sys_name = system_node.keys[0].s
            reads = [r.s for r in system_node.values[0].values[0].elts]
            writes = [w.s for w in system_node.values[0].values[1].elts]
            label = f"{sys_name}\nReads: {reads}\nWrites: {writes}"
            s.node(f"system_{sys_name}", label)
            # Add edges for component dependencies
            for comp in reads:
                dot.edge(f"comp_{comp}", f"system_{sys_name}", "read by")
            for comp in writes:
                dot.edge(f"system_{sys_name}", f"comp_{comp}", "writes to")

    # Save the visualization
    dot.render(output_file, view=True, format="png")


# Example usage:
def main(filename: str):
    # Read your game.js file
    with open(filename, "r") as f:
        js_code = f.read()

    # Generate and visualize the AST
    ast_tree = translate_js_to_ecs_ast(js_code)
    visualize_ecs_ast(ast_tree)

    # Also print the AST structure as text for reference
    print("\nECS Structure as Python dict:")
    print(astunparse.unparse(ast_tree))


if __name__ == "__main__":
    games_dir = Path(__file__).parent / "games"
    specific_game = games_dir / "1p/ecs/platformer/skybound_solo/game.js"
    main(specific_game)
