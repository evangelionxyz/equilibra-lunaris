import time
import threading
import os

class SnowflakeGenerator:
    """
    Snowflake-like ID generator.
    Structure:
    - 1 bit: Unused (always 0)
    - 41 bits: Timestamp in milliseconds
    - 10 bits: Worker/Machine ID
    - 12 bits: Sequence number
    """
    
    # Custom epoch (e.g., project start date: 2026-01-01)
    EPOCH = 1767225600000 
    
    WORKER_ID_BITS = 10
    SEQUENCE_BITS = 12
    
    MAX_WORKER_ID = (1 << WORKER_ID_BITS) - 1
    MAX_SEQUENCE = (1 << SEQUENCE_BITS) - 1
    
    WORKER_ID_SHIFT = SEQUENCE_BITS
    TIMESTAMP_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS
    
    def __init__(self, worker_id: int = 0):
        if worker_id < 0 or worker_id > self.MAX_WORKER_ID:
            # Fallback: use PID or something else if provided worker_id is invalid
            worker_id = os.getpid() & self.MAX_WORKER_ID
            
        self.worker_id = worker_id
        self.sequence = 0
        self.last_timestamp = -1
        self._lock = threading.Lock()

    def _current_timestamp(self) -> int:
        return int(time.time() * 1000)

    def generate(self) -> int:
        with self._lock:
            timestamp = self._current_timestamp()
            
            if timestamp < self.last_timestamp:
                # System clock moved backwards
                timestamp = self.last_timestamp
            
            if timestamp == self.last_timestamp:
                self.sequence = (self.sequence + 1) & self.MAX_SEQUENCE
                if self.sequence == 0:
                    # Sequence exhausted, wait for next millisecond
                    while timestamp <= self.last_timestamp:
                        timestamp = self._current_timestamp()
            else:
                self.sequence = 0
                
            self.last_timestamp = timestamp
            
            # Combine bits
            id = ((timestamp - self.EPOCH) << self.TIMESTAMP_SHIFT) | \
                 (self.worker_id << self.WORKER_ID_SHIFT) | \
                 self.sequence
            
            return id

_generator = SnowflakeGenerator(worker_id=1)