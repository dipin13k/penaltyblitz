import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { fid, type } = await req.json();
    if (!fid) return NextResponse.json({ error: 'No fid' }, { status: 400 });

    const { data } = await supabase
      .from('player_profiles')
      .select('notification_token, notification_url')
      .eq('fid', fid)
      .maybeSingle();

    if (!data?.notification_token || !data?.notification_url) {
      return NextResponse.json({ skipped: 'no token' });
    }

    const messages: Record<string, { title: string; body: string }> = {
      win: {
        title: '\uD83C\uDFC6 Great win!',
        body: 'You\'re on fire! Come back and keep climbing the leaderboard ⚽',
      },
      reminder: {
        title: '\u26BD Miss the pitch?',
        body: 'Come back and play Penalty Blitz — your streak is waiting!',
      },
    };

    const msg = messages[type] || messages.reminder;

    const res = await fetch(data.notification_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: `pb-${fid}-${Date.now()}`,
        title: msg.title,
        body: msg.body,
        targetUrl: 'https://penaltyblitz.vercel.app',
        tokens: [data.notification_token],
      }),
    });

    const result = await res.json();
    return NextResponse.json({ success: true, result });
  } catch (e) {
    console.error('Notify error:', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
