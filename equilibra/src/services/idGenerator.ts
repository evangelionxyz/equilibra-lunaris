/**
 * Snowflake-like ID generator for TypeScript.
 * Uses BigInt to handle 64-bit integers safely.
 */
class SnowflakeGenerator {
  // Custom epoch (Project start date: 2026-01-01)
  private readonly EPOCH = BigInt(1767225600000);

  private readonly WORKER_ID_BITS = BigInt(10);
  private readonly SEQUENCE_BITS = BigInt(12);

  private readonly MAX_WORKER_ID =
    (BigInt(1) << this.WORKER_ID_BITS) - BigInt(1);
  private readonly MAX_SEQUENCE = (BigInt(1) << this.SEQUENCE_BITS) - BigInt(1);

  private readonly WORKER_ID_SHIFT = this.SEQUENCE_BITS;
  private readonly TIMESTAMP_SHIFT = this.SEQUENCE_BITS + this.WORKER_ID_BITS;

  private workerId: bigint;
  private sequence: bigint = BigInt(0);
  private lastTimestamp: bigint = BigInt(-1);

  constructor(workerId: number = 0) {
    const wId = BigInt(workerId);
    if (wId < BigInt(0) || wId > this.MAX_WORKER_ID) {
      this.workerId = BigInt(
        Date.now() % Number(this.MAX_WORKER_ID + BigInt(1)),
      );
    } else {
      this.workerId = wId;
    }
  }

  private currentTimestamp(): bigint {
    return BigInt(Date.now());
  }

  public generate(): bigint {
    let timestamp = this.currentTimestamp();

    if (timestamp < this.lastTimestamp) {
      // Clock moved backwards
      timestamp = this.lastTimestamp;
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + BigInt(1)) & this.MAX_SEQUENCE;
      if (this.sequence === BigInt(0)) {
        // Wait for next millisecond
        while (timestamp <= this.lastTimestamp) {
          timestamp = this.currentTimestamp();
        }
      }
    } else {
      this.sequence = BigInt(0);
    }

    this.lastTimestamp = timestamp;

    const id =
      ((timestamp - this.EPOCH) << this.TIMESTAMP_SHIFT) |
      (this.workerId << this.WORKER_ID_SHIFT) |
      this.sequence;

    return id;
  }
}

// Singleton instance
const _generator = new SnowflakeGenerator(1);

/**
 * Generates a unique 64-bit ID as a BigInt.
 */
export const generateId = (): bigint => {
  return _generator.generate();
};

/**
 * Generates a unique 64-bit ID as a string.
 * Recommended for sending to API/Database.
 */
export const generateIdString = (): string => {
  return generateId().toString();
};
