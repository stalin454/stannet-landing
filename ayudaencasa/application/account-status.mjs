import {requireActive} from '../domain/authorization.mjs';
export function requireMarketplacePrincipal(principal){return requireActive(principal);}
