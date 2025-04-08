import datetime
import json
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import pyarrow as pa
import pyarrow.parquet as pq
from huggingface_hub import CommitScheduler
from huggingface_hub.hf_api import HfApi


class ParquetScheduler(CommitScheduler):
    """Scheduler to efficiently save preferences to HuggingFace Hub in Parquet format."""

    def __init__(
        self,
        *,
        repo_id: str,
        schema: Optional[Dict[str, Dict[str, str]]] = None,
        every: Union[int, float] = 5,
        path_in_repo: Optional[str] = "data",
        repo_type: Optional[str] = "dataset",
        revision: Optional[str] = None,
        private: bool = False,
        token: Optional[str] = None,
        allow_patterns: Union[List[str], str, None] = None,
        ignore_patterns: Union[List[str], str, None] = None,
        hf_api: Optional[HfApi] = None,
    ) -> None:
        super().__init__(
            repo_id=repo_id,
            folder_path="dummy",  # not used by the scheduler
            every=every,
            path_in_repo=path_in_repo,
            repo_type=repo_type,
            revision=revision,
            private=private,
            token=token,
            allow_patterns=allow_patterns,
            ignore_patterns=ignore_patterns,
            hf_api=hf_api,
        )

        self._rows: List[Dict[str, Any]] = []
        self._schema = schema

    def append(self, row: Dict[str, Any]) -> None:
        """Add a new item to be uploaded."""
        with self.lock:
            self._rows.append(row)

    def push_to_hub(self):
        # Check for new rows to push
        with self.lock:
            rows = self._rows
            self._rows = []
        if not rows:
            return
        print(f"Got {len(rows)} item(s) to commit.")

        # Load schema
        schema: Dict[str, Dict] = self._schema or {}
        for row in rows:
            for key, value in row.items():
                # Infer schema if not provided
                if key not in schema:
                    schema[key] = _infer_schema(key, value)

        # Complete rows if needed
        for row in rows:
            for feature in schema:
                if feature not in row:
                    row[feature] = None

        # Export items to Arrow format
        table = pa.Table.from_pylist(rows)

        # Add metadata (used by datasets library)
        table = table.replace_schema_metadata(
            {"huggingface": json.dumps({"info": {"features": schema}})}
        )

        # Write to parquet file
        filename = f"{uuid.uuid4()}.parquet"
        pq.write_table(table, filename)

        # Upload
        self.api.upload_file(
            repo_id=self.repo_id,
            repo_type=self.repo_type,
            revision=self.revision,
            path_in_repo=filename,
            path_or_fileobj=filename,
        )
        print(f"Commit completed.")

        # Cleanup
        Path(filename).unlink(missing_ok=True)


def _infer_schema(key: str, value: Any) -> Dict[str, str]:
    """Infer schema for the datasets library."""
    if isinstance(value, int):
        return {"_type": "Value", "dtype": "int64"}
    if isinstance(value, float):
        return {"_type": "Value", "dtype": "float64"}
    if isinstance(value, bool):
        return {"_type": "Value", "dtype": "bool"}
    if isinstance(value, bytes):
        return {"_type": "Value", "dtype": "binary"}
    # Otherwise in last resort => convert it to a string
    return {"_type": "Value", "dtype": "string"} 