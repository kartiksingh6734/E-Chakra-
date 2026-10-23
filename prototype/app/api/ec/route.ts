import { database, ownerOf, sameOrigin, fail } from '@/lib/server';
import { getSnapshot, saveAction } from '@/lib/collector-api';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try { return await getSnapshot(database(),ownerOf(request)); } catch(error) { return fail(error); }
}
export async function POST(request:Request){
 try { sameOrigin(request);return await saveAction(request,database(),ownerOf(request)); } catch(error) { return fail(error); }
}
