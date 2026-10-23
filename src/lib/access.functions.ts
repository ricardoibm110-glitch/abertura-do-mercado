import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

export const getAccess = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [request, role] = await Promise.all([
    context.supabase.from('access_requests').select('status,email').eq('user_id', context.userId).maybeSingle(),
    context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' }),
  ]);
  if (request.error || role.error) throw new Error('Não foi possível verificar o acesso.');
  return { status: request.data?.status ?? 'pending', email: request.data?.email ?? '', admin: role.data === true };
});

export const listRequests = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (role.error || !role.data) throw new Error('Acesso exclusivo do administrador.');
  const result = await context.supabase.from('access_requests').select('*').order('created_at', { ascending: false });
  if (result.error) throw new Error('Não foi possível carregar os acessos.');
  return result.data;
});

export const reviewRequest = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ userId: z.string().uuid(), status: z.enum(['approved', 'rejected', 'pending']) }))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (role.error || !role.data) throw new Error('Acesso exclusivo do administrador.');
    const result = await context.supabase.from('access_requests').update({ status: data.status }).eq('user_id', data.userId).select('user_id').single();
    if (result.error) throw new Error('Não foi possível atualizar o acesso.');
    return { success: true };
  });