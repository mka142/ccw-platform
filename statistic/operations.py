"""
Data resampling operations for time-series data
based on the https://github.com/mka142/ccw-platform/blob/main/web-analysis/src/lib/dataOperations.ts
"""
from typing import List, Dict, Literal
import pandas as pd

InterpolationMethod = Literal['linear', 'step']


def linear_interpolate(
    x: float,
    x0: float,
    y0: float,
    x1: float,
    y1: float
) -> float:
    """
    Linear interpolation between two points
    
    Args:
        x: The x-coordinate at which to interpolate
        x0: X-coordinate of first point
        y0: Y-coordinate of first point
        x1: X-coordinate of second point
        y1: Y-coordinate of second point
        
    Returns:
        Interpolated y-value at x
    """
    if x1 == x0:
        return y0
    return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0)


def step_interpolate(y0: float) -> float:
    """
    Step interpolation (zero-order hold)
    Uses the value from the point with smaller or equal timestamp
    
    Args:
        y0: The y-value to hold
        
    Returns:
        The held y-value
    """
    return y0


def resample_data(
    data: List[Dict[str, float]],
    window_ms: float,
    interpolation_method: InterpolationMethod = 'linear'
) -> List[Dict[str, float]]:
    """
    Resample data to fixed time windows with interpolation
    
    Args:
        data: List of dictionaries with 'timestamp' and 'value' keys
        window_ms: Window size in milliseconds
        interpolation_method: 'linear' or 'step' interpolation
        
    Returns:
        List of resampled data points with 'timestamp' and 'value' keys
    """
    if len(data) == 0 or window_ms <= 0:
        return data
    
    # Sort data by timestamp
    sorted_data = sorted(data, key=lambda x: x['timestamp'])
    
    if len(sorted_data) == 1:
        return sorted_data
    
    # Find min and max timestamps
    min_time = sorted_data[0]['timestamp']
    max_time = sorted_data[-1]['timestamp']
    
    # Generate resampled timestamps
    result: List[Dict[str, float]] = []
    start_bucket = int(min_time // window_ms) * window_ms
    end_bucket = int((max_time // window_ms) + 1) * window_ms
    
    timestamp = start_bucket
    while timestamp <= end_bucket:
        # Find points with smaller/equal and larger/equal timestamp
        lower_point = None
        upper_point = None
        
        for i in range(len(sorted_data)):
            if sorted_data[i]['timestamp'] <= timestamp:
                lower_point = sorted_data[i]
            if sorted_data[i]['timestamp'] >= timestamp and upper_point is None:
                upper_point = sorted_data[i]
                break
        
        value: float
        
        if lower_point is None and upper_point is not None:
            # Before first point - use first value
            value = upper_point['value']
        elif lower_point is not None and upper_point is None:
            # After last point - use last value
            value = lower_point['value']
        elif lower_point is not None and upper_point is not None:
            # Between points - interpolate
            if lower_point['timestamp'] == timestamp:
                value = lower_point['value']
            elif upper_point['timestamp'] == timestamp:
                value = upper_point['value']
            else:
                if interpolation_method == 'linear':
                    value = linear_interpolate(
                        timestamp,
                        lower_point['timestamp'],
                        lower_point['value'],
                        upper_point['timestamp'],
                        upper_point['value']
                    )
                else:
                    # step interpolation
                    value = step_interpolate(lower_point['value'])
        else:
            # Skip if no points available
            timestamp += window_ms
            continue
        
        result.append({'timestamp': timestamp, 'value': value})
        timestamp += window_ms
    
    return result


def resample_dataframe(
    df: pd.DataFrame,
    window_ms: float,
    interpolation_method: InterpolationMethod = 'linear',
    timestamp_col: str = 'timestamp',
    value_col: str = 'value'
) -> pd.DataFrame:
    """
    Resample a pandas DataFrame to fixed time windows with interpolation
    
    Args:
        df: DataFrame with timestamp and value columns
        window_ms: Window size in milliseconds
        interpolation_method: 'linear' or 'step' interpolation
        timestamp_col: Name of the timestamp column
        value_col: Name of the value column
        
    Returns:
        Resampled DataFrame
    """
    if df.empty:
        return df
    
    # Convert DataFrame to list of dicts
    data = df[[timestamp_col, value_col]].to_dict('records')
    data = [{'timestamp': row[timestamp_col], 'value': row[value_col]} 
            for row in data]
    
    # Resample
    resampled = resample_data(data, window_ms, interpolation_method)
    
    # Convert back to DataFrame
    result_df = pd.DataFrame(resampled)
    
    # Restore column names if they were different
    if timestamp_col != 'timestamp' or value_col != 'value':
        result_df = result_df.rename(columns={
            'timestamp': timestamp_col,
            'value': value_col
        })
    
    return result_df
