'use client';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => { window.location.href = '/app'; }, []);
  return <div className="container"><div className="card"><div className="h1">AFA Espiga</div><p className="p">Carregant…</p></div></div>;
}
