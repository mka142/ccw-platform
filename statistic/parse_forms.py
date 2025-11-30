# read forms.json and save a new file with only filterd pieceId entries

"""Script to parse research form data and filter by pieceId.
Saves the filtered data to a new JSON file.
"""
import json


def parse_forms(input_filename: str, output_filename: str, piece_id: str) -> None:
    """
    Parse the forms JSON file and save entries matching the pieceId to a new file.

    Args:
        input_filename (str): Path to the input JSON file.
        output_filename (str): Path to the output JSON file.
        piece_id (str): The pieceId to filter by.
    """
    with open(input_filename, "r") as infile:
        data = json.load(infile)

    filtered_data = [entry for entry in data if entry["pieceId"] == piece_id]
    
    # extract clientId as a id and remove _id field
    for entry in filtered_data:
        entry["id"] = entry["clientId"]["$oid"]
        del entry["_id"]
        del entry["clientId"]

    with open(output_filename, "w") as outfile:
        json.dump(filtered_data, outfile, indent=2)

    print(
        f"Saved {len(filtered_data)} records to {output_filename} for pieceId '{piece_id}'."
    )


if __name__ == "__main__":
    DATE = "30-10-2025"
    pieces = [
        "sample-piece-id",
    ]
    input_filename = "data/sample-forms.json"

    for piece_id in pieces:
        output_filename = f"output/forms_{piece_id}_{DATE}.json"
        parse_forms(input_filename, output_filename, piece_id)
