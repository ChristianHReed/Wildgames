"""Export the survivor base bodies (masculine, feminine) as OBJ and GLB, one object per skeleton bone, metres, Y up, facing +Z.
Run: python3 workshop/tools/export_base_body.py [out_dir]"""
import sys, os, numpy as np
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); P=os.path.join(ROOT, 'assets/shaped/src/survivor.py'); OUT=sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
os.chdir(os.path.dirname(P)); sys.path.insert(0, '.')
src=open(P).read().split("\nif __name__")[0]
ns={'__name__':'sv','__file__':P}
import io, contextlib
with contextlib.redirect_stdout(io.StringIO()): exec(compile(src,'sv','exec'),ns)
import json, struct
def write_glb(path, meshes):
    buf=b''; views=[]; acc=[]; gm=[]; nodes=[]
    for name, V, T in meshes:
        pv=len(views); vb=V.tobytes(); views.append({'buffer':0,'byteOffset':len(buf),'byteLength':len(vb),'target':34962}); buf+=vb
        while len(buf)%4: buf+=b'\0'
        ib=T.astype(np.uint32).tobytes(); views.append({'buffer':0,'byteOffset':len(buf),'byteLength':len(ib),'target':34963}); buf+=ib
        while len(buf)%4: buf+=b'\0'
        a=len(acc)
        acc.append({'bufferView':pv,'componentType':5126,'count':len(V),'type':'VEC3','min':V.min(0).tolist(),'max':V.max(0).tolist()})
        acc.append({'bufferView':pv+1,'componentType':5125,'count':int(T.size),'type':'SCALAR'})
        gm.append({'name':name,'primitives':[{'attributes':{'POSITION':a},'indices':a+1}]}); nodes.append({'name':name,'mesh':len(gm)-1})
    js={'asset':{'version':'2.0','generator':'Afterstreet base export'},'scene':0,'scenes':[{'nodes':list(range(len(nodes)))}],'nodes':nodes,'meshes':gm,'accessors':acc,'bufferViews':views,'buffers':[{'byteLength':len(buf)}]}
    j=json.dumps(js).encode()
    while len(j)%4: j+=b' '
    out=struct.pack('<III',0x46546C67,2,12+8+len(j)+8+len(buf))+struct.pack('<II',len(j),0x4E4F534A)+j+struct.pack('<II',len(buf),0x004E4942)+buf
    open(path,'wb').write(out)
for fem, name in ((False,'masculine'),(True,'feminine')):
    parts = ns['body'](fem)
    meshes=[]; obj=[]; vo=1; allV=[]; allF=[]
    for bone, pieces in parts.items():
        V=[]; F=[]
        for q in pieces:
            if q.get('s')!='poly': continue
            base=len(V); p=q['p']
            V += [[p[0]+v[0], p[1]+v[1], p[2]+v[2]] for v in q['v']]
            F += [[base+i for i in f] for f in q['f']]
        if not V: continue
        # OBJ keeps quads and n-gons as they are
        obj.append('o %s\n' % bone + ''.join('v %.4f %.4f %.4f\n' % tuple(v) for v in V) + ''.join('f ' + ' '.join(str(vo+i) for i in f) + '\n' for f in F))
        vo += len(V)
        tris=[[f[0],f[i],f[i+1]] for f in F for i in range(1,len(f)-1)]
        meshes.append((bone, np.array(V, np.float32), np.array(tris, np.uint32)))
    open(os.path.join(OUT, 'afterstreet_base_%s.obj'%name),'w').write('# Afterstreet survivor base body, %s. Metres, Y up, facing +Z, left side is +X. One object per skeleton bone.\n'%name + ''.join(obj))
    write_glb(os.path.join(OUT, 'afterstreet_base_%s.glb'%name), meshes)
    print(name, 'objects', len(parts), 'verts', vo-1)
