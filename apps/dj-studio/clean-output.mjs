import { rm } from 'node:fs/promises';
// This directory belongs exclusively to this app, created on the DJ feature branch.
await rm(new URL('../../dj-studio/', import.meta.url), {recursive:true,force:true});
