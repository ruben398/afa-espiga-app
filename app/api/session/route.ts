import { getSessionFromRequest } from '../../../lib/auth';
import { json } from '../../../lib/routeHelpers';

export async function GET(req: Request) {
  const session = getSessionFromRequest(req);
  return json({ ok: true, session });
}
