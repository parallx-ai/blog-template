"""Writes the NumPy and Parquet files that test/figures.js reads (run from this folder)."""
import numpy as np
import pyarrow as pa
import pyarrow.parquet as pq

grid = np.arange(12, dtype=np.float32).reshape(3, 4) / 4
np.save("f4.npy", grid)
np.save("f2.npy", np.array([0.5, -1.25, 1000.0, 6.1e-5], dtype=np.float16))
np.save("f8-big-endian.npy", np.array([1.5, -2.25, 3.0], dtype=">f8"))
np.save("i8.npy", np.array([-3, 0, 2**40], dtype=np.int64))
np.save("u1.npy", np.array([0, 7, 255], dtype=np.uint8))
np.save("bool.npy", np.array([True, False, True]))
np.save("fortran.npy", np.asfortranarray(np.arange(6, dtype=np.int32).reshape(2, 3)))
np.save("scalar.npy", np.float64(2.5))

table = pa.table({
    "layer": pa.array([0, 16, 32], pa.int64()),
    "accuracy": pa.array([0.52, 0.88, 0.66], pa.float64()),
    "label": pa.array(["first", "middle", "last"], pa.string()),
})
pq.write_table(table, "rows.parquet")  # snappy, as pandas and pyarrow write by default
