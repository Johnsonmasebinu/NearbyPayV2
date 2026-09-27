const { Client } = require('pg');

const SQL = `
CREATE OR REPLACE FUNCTION public.add_money_deposit(
  p_amount numeric,
  p_channel text DEFAULT 'Bank Transfer',
  p_description text DEFAULT 'Deposit to Wallet'
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_ref text;
  v_new_balance numeric;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required.');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Deposit amount must be greater than ₦0.');
  END IF;

  v_ref := 'DEP-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || upper(substr(md5(random()::text), 1, 6));

  INSERT INTO public.transactions (
    user_id,
    title,
    category,
    amount,
    type,
    status,
    reference,
    channel,
    description,
    created_at
  ) VALUES (
    v_user_id,
    'Wallet Deposit',
    'Deposit',
    p_amount,
    'received',
    'Completed',
    v_ref,
    COALESCE(NULLIF(trim(p_channel), ''), 'Bank Transfer'),
    COALESCE(NULLIF(trim(p_description), ''), 'Deposit via virtual account'),
    now()
  );

  SELECT COALESCE(SUM(CASE WHEN type = 'received' THEN amount ELSE -amount END), 0)
  INTO v_new_balance
  FROM public.transactions
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'reference', v_ref,
    'amount', p_amount,
    'newBalance', v_new_balance,
    'message', '₦' || trim(to_char(p_amount, '999,999,990.00')) || ' deposited successfully.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.add_money_deposit(numeric, text, text) TO authenticated, anon;
`;

async function main() {
  const client = new Client({
    host: '2a05:d018:f3f:3101:57a6:c6f3:b137:f987',
    port: 5432,
    user: 'postgres',
    password: 'ANT@wasp2026',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to PostgreSQL database.');
  await client.query(SQL);
  console.log('Successfully deployed add_money_deposit RPC function!');
  await client.end();
}

main().catch((err) => {
  console.error('Error deploying:', err);
  process.exit(1);
});
