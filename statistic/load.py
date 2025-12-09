import csv
import json
import pandas as pd
import numpy as np
from typing import Optional


# Read csv and create a function to find row by given clientId column
def read_csv_to_dict(filename: str) -> dict:
    """Read CSV file and return a dictionary with clientId as keys."""
    data_dict = {}
    with open(filename, mode="r", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            parsedClientId = (
                row["userId"].strip("ObjectId(").strip(")").strip("'").strip('"')
            )
            data_dict[parsedClientId] = row
    return data_dict


def load_ready_data(filepath) -> pd.Series:
    print(f"--- 1. Wczytywanie danych: {filepath} ---")
    df = pd.read_csv(filepath, low_memory=False)

    df = df.sort_values("timestamp")

    # Group by record_id and label, convert to numpy arrays
    # Result: Series with (record_id, label) as index, numpy array of values
    grouped = df.groupby(["record_id", "label"])["value"].apply(
        lambda x: np.array(x.values)
    )
    
    return grouped


def standardize_data(series: pd.Series) -> pd.Series:
    # STANDARYZACJA (Z-score) do obliczeń korelacji
    # Apply standardization to each numpy array in the series
    def standardize_array(arr):
        # Convert to float to avoid integer division issues
        arr = arr.astype(float)
        mean = arr.mean()
        std = arr.std()
        if std == 0:
            return arr - mean  # All values are the same
        return (arr - mean) / std
    
    return series.apply(standardize_array)


def difference_data(series: pd.Series) -> pd.Series:
    # Różnicowanie danych (First Difference)
    # Apply first difference to each numpy array in the series
    def diff_array(arr):
        # Convert to float for calculations
        arr = arr.astype(float)
        if len(arr) <= 1:
            return arr
        diff = np.diff(arr)
        # Prepend 0 to keep same length
        return np.concatenate([[0.0], diff])
    
    return series.apply(diff_array)


def load_tags_config(filename: str) -> dict:
    """Load tags configuration from a txt file."""
    """Sample:
    płeć: mężczyzna, kobieta
    wykształcenie: średnie ogólne
    preferencje muzyczne wartość: 2<=x<=4
    """
    tags_config = {}
    with open(filename, "r", encoding="utf-8") as file:
        for line in file:
            line = line.strip()
            if not line or ":" not in line:
                continue
            
            tag_name, tag_values = line.split(":", 1)
            tag_name = tag_name.strip()
            tag_values = tag_values.strip()
            
            # Check if it's a range constraint (e.g., "2<=x<=4")
            has_comparison = (
                "<=" in tag_values
                or ">=" in tag_values
                or "<" in tag_values
                or ">" in tag_values
            )
            if has_comparison and "x" in tag_values:
                tags_config[tag_name] = {
                    "type": "range",
                    "constraint": tag_values,
                }
            else:
                # It's a list of categorical values
                values = [v.strip() for v in tag_values.split(",")]
                tags_config[tag_name] = {
                    "type": "categorical",
                    "values": values,
                }
    
    return tags_config


def filter_by_tags(
    series: pd.Series,
    tags_csv_file: str,
    tag_filters: Optional[dict] = None,
    tags_config: Optional[dict] = None,
) -> pd.Series:
    """Filter series by matching record_id to global:<id> tags.
    
    Args:
        series: Series with (record_id, label) as index
        tags_csv_file: Path to CSV file with userId and tag columns
        tag_filters: Dict of tag filters e.g. {'answers.gender': 'kobieta'}
        tags_config: Optional tag validation rules from load_tags_config
    
    Returns:
        Filtered Series keeping only matching user records
    """
    # Load tags from CSV file
    tags_dict = read_csv_to_dict(tags_csv_file)
    
    # Filter user IDs based on tag_filters and tags_config
    valid_user_ids = set()
    
    for user_id, user_data in tags_dict.items():
        # Check if user matches all filters
        matches = True
        
        if tag_filters:
            for tag_name, filter_value in tag_filters.items():
                user_value = user_data.get(tag_name)
                
                if isinstance(filter_value, list):
                    if user_value not in filter_value:
                        matches = False
                        break
                else:
                    if user_value != filter_value:
                        matches = False
                        break
        
        # Validate against tags_config if provided
        if matches and tags_config:
            for tag_name, tag_spec in tags_config.items():
                user_value = user_data.get(tag_name)
                
                if tag_spec["type"] == "categorical":
                    if user_value and user_value not in tag_spec["values"]:
                        matches = False
                        break
                elif tag_spec["type"] == "range":
                    try:
                        if user_value:
                            val = float(user_value)
                            constraint = tag_spec["constraint"]
                            if not eval(constraint.replace("x", str(val))):
                                matches = False
                                break
                    except (ValueError, TypeError):
                        matches = False
                        break
        
        if matches:
            valid_user_ids.add(user_id)
    
    # Filter series by matching record_ids to valid user IDs
    mask = []
    for record_id, label in series.index:
        # Extract userId from record_id (format: "global:<userId>")
        if isinstance(record_id, str) and record_id.startswith("global:"):
            user_id = record_id.split(":", 1)[1]
        else:
            user_id = str(record_id)
        
        mask.append(user_id in valid_user_ids)
    
    return series[mask]
