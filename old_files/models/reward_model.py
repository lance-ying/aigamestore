import torch
import torch.nn as nn
from torch.nn import TransformerEncoder, TransformerEncoderLayer
from typing import Optional, Tuple
from transformers import GPT2Tokenizer


class RewardModel(nn.Module):
    """
    A transformer-based reward model for evaluating code quality.
    Takes a single code snippet and predicts a version score.
    """

    def __init__(
        self,
        vocab_size: int = 50257,  # GPT2's vocab size
        d_model: int = 512,
        nhead: int = 8,
        num_encoder_layers: int = 6,
        dim_feedforward: int = 2048,
        dropout: float = 0.1,
        max_seq_length: int = 1024,
        max_score: float = 10.0,  # v0->0, v1->1, ..., v10->10
    ):
        """
        Initialize the reward model

        Args:
            vocab_size: Size of the vocabulary
            d_model: Dimension of the transformer model
            nhead: Number of attention heads
            num_encoder_layers: Number of transformer encoder layers
            dim_feedforward: Dimension of feedforward network
            dropout: Dropout rate
            max_seq_length: Maximum sequence length
            max_score: Maximum score for version range (0-10)
        """
        super().__init__()

        self.max_seq_length = max_seq_length
        self.max_score = max_score

        # Initialize GPT2 tokenizer
        self.tokenizer = GPT2Tokenizer.from_pretrained("gpt2")

        # Embedding layers
        self.token_embedding = nn.Embedding(vocab_size, d_model)
        self.position_embedding = nn.Embedding(max_seq_length, d_model)
        self.code_type_embedding = nn.Embedding(2, d_model)  # 0 for HTML, 1 for JS

        # Transformer encoder
        encoder_layers = TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True,
        )
        self.transformer = TransformerEncoder(encoder_layers, num_encoder_layers)

        # Output layers
        self.layer_norm = nn.LayerNorm(d_model)
        self.dropout = nn.Dropout(dropout)

        # Simple score head for single score output
        self.score_head = nn.Sequential(
            nn.Linear(d_model, d_model // 2),
            nn.ReLU(),
            nn.Linear(d_model // 2, 1),
            nn.Sigmoid(),  # Output between 0 and 1
        )

    def encode_code(
        self, html_code: str, js_code: str
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """Encode HTML and JavaScript code into token IDs"""
        # Encode both code parts using GPT2 tokenizer
        html_tokens = self.tokenizer.encode(
            html_code, truncation=True, max_length=self.max_seq_length // 2
        )
        js_tokens = self.tokenizer.encode(
            js_code, truncation=True, max_length=self.max_seq_length // 2
        )

        # Combine tokens
        input_ids = html_tokens + js_tokens
        attention_mask = [1] * len(input_ids)
        code_type_ids = [0] * len(html_tokens) + [1] * len(js_tokens)

        # Pad if needed
        if len(input_ids) < self.max_seq_length:
            padding_length = self.max_seq_length - len(input_ids)
            input_ids = input_ids + [self.tokenizer.pad_token_id] * padding_length
            attention_mask = attention_mask + [0] * padding_length
            code_type_ids = code_type_ids + [0] * padding_length

        return (
            torch.tensor(input_ids),
            torch.tensor(attention_mask),
            torch.tensor(code_type_ids),
        )

    def forward(self, html_code: str, js_code: str) -> torch.Tensor:
        """
        Evaluate the quality of game code
        Returns a single score representing the predicted version
        """
        # Encode code
        input_ids, attention_mask, code_type_ids = self.encode_code(html_code, js_code)
        device = input_ids.device

        # Create position ids
        position_ids = torch.arange(input_ids.size(-1), device=device).unsqueeze(0)

        # Get embeddings
        token_embeds = self.token_embedding(input_ids)
        position_embeds = self.position_embedding(position_ids)
        code_type_embeds = self.code_type_embedding(code_type_ids)

        # Combine embeddings
        embeddings = token_embeds + position_embeds + code_type_embeds
        embeddings = self.dropout(embeddings)

        # Pass through transformer
        transformer_output = self.transformer(
            embeddings,
            src_key_padding_mask=(
                ~attention_mask.bool() if attention_mask is not None else None
            ),
        )

        # Get sequence representation
        sequence_output = transformer_output.mean(dim=1)
        sequence_output = self.layer_norm(sequence_output)

        # Generate single score scaled to version range (0-10)
        score = self.score_head(sequence_output).squeeze(-1) * self.max_score
        return score

    def compute_loss(
        self, predicted_scores: torch.Tensor, version_numbers: torch.Tensor
    ) -> torch.Tensor:
        """Compute loss between predicted scores and version numbers"""
        return nn.MSELoss()(predicted_scores, version_numbers.float())
