import path from 'path'
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const lobbyDna = path.join(__dirname, "../../dnas/lobby/workdir/lobby.dna");
export const privatePublicationDna = path.join(__dirname, "../../dnas/private_publication/workdir/private_publication.dna");
export const progenitorHapp = path.join(__dirname, "../../workdir/progenitor/private_publication.happ");
export const privatePublicationHapp = path.join(__dirname, "../../workdir/progenitor/private_publication.happ");



