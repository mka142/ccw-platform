# Concert Statistics Analysis Tool

A Python-based statistical analysis tool for concert audience feedback data.

## Files

- **`db.py`** - Database handler for reading and querying JSON data
- **`operations.py`** - Data resampling operations with linear/step interpolation
- **`main.py`** - Interactive terminal interface for statistical analysis
- **`test_db.py`** - Test suite for database functions
- **`test_operations.py`** - Test suite for resampling operations

## Requirements

```bash
pip install pandas numpy scipy
```

Or activate the virtual environment:
```bash
source env/bin/activate
```

## Usage

### Interactive Analysis

Run the main script for interactive analysis:

```bash
python main.py
```

The tool will guide you through:
1. **Concert Selection** - Choose a specific concert or all concerts
2. **Piece Selection** - Choose a specific musical piece or all pieces
3. **User Selection** - Choose specific users or all users
4. **Test Selection** - Choose the statistical test to run
5. **Configuration** - Set resampling parameters (e.g., window size)

### Available Tests

#### Spearman Rank Correlation
- Non-parametric test for correlation between users' responses
- Matrix format: rows = time samples, columns = users
- Outputs:
  - Full correlation matrix
  - P-values for each correlation
  - Summary statistics (mean, median, std, min, max)
  - Count of significant correlations (p < 0.05)

### Example Session

```
Select concert: 1 (Koncert 28.10)
Select piece: 1 (fantazja-michal-kulbacki-3)
Select users: 32 (ALL users)
Select test: 1 (Spearman Rank Correlation)
Resample window: 1000 (1 second windows)
```

Results:
- Data matrix: 318 samples × 31 users
- Mean correlation: 0.4479
- Significant correlations: 92.9%

## Database Structure

### Data Files (in `data/` directory)

- **`concerts.json`** - Concert metadata
- **`forms.json`** - User feedback forms (63MB)
- **`users.json`** - User information
- **`examination_forms.json`** - (not currently used)

### Key Functions

#### Database (`db.py`)

```python
from db import Database

db = Database()

# List all concerts
concerts = db.list_concerts()

# List pieces for a concert
pieces = db.list_concert_pieces(concert_id)

# List users for a concert and piece
users = db.list_concert_piece_users(concert_id, piece_id)

# Get forms for specific concert, piece, and user
forms = db.get_forms_for_concert_piece_user(concert_id, piece_id, user_id)

# Get forms as pandas DataFrame
df = db.get_forms_dataframe(concert_id=concert_id, piece_id=piece_id)
```

#### Resampling (`operations.py`)

```python
from operations import resample_data

# Resample time-series data
resampled = resample_data(
    data,  # List of {'timestamp': ..., 'value': ...}
    window_ms=1000,  # 1 second windows
    interpolation_method='linear'  # or 'step'
)
```

## Testing

Run test suites:

```bash
# Test database functions
python test_db.py

# Test resampling operations
python test_operations.py
```

## Data Flow

1. Load JSON data from files
2. Query specific concert/piece/user combinations
3. Resample irregular time-series to fixed windows
4. Build analysis matrix (rows = samples, columns = users)
5. Apply statistical tests (e.g., Spearman correlation)
6. Display results and summary statistics

## Notes

- Large forms.json file (63MB) - loading may take a few seconds
- Resampling uses linear interpolation by default
- NaN values are handled automatically in correlation calculations
- All timestamps are in milliseconds (Unix epoch)
