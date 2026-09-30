import type { APIRoute } from 'astro';
import { handleContact } from '../../server/contact';

export const prerender = false;
export const ALL: APIRoute = ({ request, clientAddress }) => handleContact(request, clientAddress);
