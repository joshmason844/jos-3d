import json, struct, numpy as np
CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
def load(path):
    b = open(path, 'rb').read()
    jl = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + jl])
    bo = 20 + jl; bl = struct.unpack('<I', b[bo:bo + 4])[0]; bin_ = b[bo + 8:bo + 8 + bl]
    def acc(i):
        a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]
        off = bv.get('byteOffset', 0) + a.get('byteOffset', 0); n = NC[a['type']]; dt = np.dtype(CT[a['componentType']])
        stride = bv.get('byteStride', 0)
        if stride and stride != n * dt.itemsize:
            raw = np.frombuffer(bin_, np.uint8, a['count'] * stride, off).reshape(-1, stride)[:, :n * dt.itemsize]
            return raw.copy().view(dt).reshape(-1, n)
        return np.frombuffer(bin_, dt, a['count'] * n, off).reshape(-1, n)
    return j, bin_, acc
