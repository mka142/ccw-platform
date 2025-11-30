import csv
import json


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


def get_config_template(records: list) -> dict:

    records_metadata = {}
    for record in records:
        records_metadata[record["id"]] = {
            "id": record["id"],
            "tags": record.get("tags", []),
            "xMove": 0,
            "yMove": 0,
            "operations": [],
        }

    return {
        "version": "1.0.0",
        "resampling": {
            "applied": False,
            "windowMs": 1000,
            "interpolationMethod": "linear",
        },
        "recordMetadata": records_metadata,
        "globalOperations": [],
        "filterByIds": [],
        "filterByTags": [],
        "excludeTags": [],
        "sets": [],
        "visible": {"records": True, "sets": True},
        "recordingStartTimestamp": 0,
    }


def get_forms_file_unique_ids(input_filename: str) -> set:
    """Get unique clientIds from forms JSON file."""
    with open(input_filename, "r") as infile:
        data = json.load(infile)

    unique_ids = {entry["id"] for entry in data}
    return unique_ids


columns_to_add_in_config_recordMetadata = [
    "answers.gender",
    "answers.age",
    "answers.generalEducation",
    "answers.musicalEducation",
    "answers.concentrationLevel",
    "answers.concertFrequency",
    "answers.musicPreferences",
    "answers.otherMusicPreference",
]


def value_mapper(key, value):
    if key == "answers.musicPreferences":
        return value.strip("[]").replace("'", "").replace('"', "").split(",")
    if key == "answers.generalEducation":
        return [f"wykszt. {value}"]
    if key == "answers.concretrationLevel":
        return [f"poz. koncent.: {value}"]
    if key == "answers.concertFrequency":
        return [f"częst. słuch. kon: {value}"]

    if value == "":
        return []

    return [value]


DATE = "30-10-2025"
OUTPUT_DIR = "output"


config_piece = [
    {
        "pieceId": "sample-piece-id",
        "output_file": f"{OUTPUT_DIR}/Konfiguracja sample-piece-id {DATE}.json",
    },
]

# if config files empty it will be created from scratch
config_files = []


respones_csv = "data/sample-examination_forms.csv"
responses_dict = read_csv_to_dict(respones_csv)


if not config_files:
    for piece in config_piece:
        piece_id = piece["pieceId"]
        forms_file = f"output/forms_{piece_id}_{DATE}.json"
        output_file = piece["output_file"]

        print(f"Generating config for pieceId: {piece_id}")
        with open(forms_file, "r") as infile:
            forms_data = json.load(infile)

        config_data = get_config_template(forms_data)
        with open(output_file, "w") as outfile:
            json.dump(config_data, outfile, indent=2)
        config_files.append(output_file)


for config_file in config_files:
    print(f"Processing config file: {config_file}")
    with open(config_file, "r") as infile:
        config_data = json.load(infile)
    for client_id in config_data["recordMetadata"].keys():
        if client_id in responses_dict:
            response_row = responses_dict[client_id]
            for column in columns_to_add_in_config_recordMetadata:
                if column in response_row:
                    mapped_value = value_mapper(column, response_row[column])
                    config_data["recordMetadata"][client_id]["tags"].extend(
                        mapped_value
                    )
                # get index + 2 for the csv line number (header + 1-based index)
            config_data["recordMetadata"][client_id][
                "label"
            ] = f"{list(responses_dict).index(client_id) + 2}"
        else:
            print(f"ClientId {client_id} not found in responses CSV.")
    with open(config_file, "w") as outfile:
        json.dump(config_data, outfile, indent=2)
