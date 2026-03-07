import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, notificationDetails, fid } = body;

    if (event === 'frame_added' && notificationDetails) {
      const { url, token } = notificationDetails;
      if (fid && token && url) {
        await supabase
          .from('player_profiles')
          .update({ notification_token: token, notification_url: url })
          .eq('fid', fid);
      }
      return NextResponse.json({ success: true });
    }

    if (event === 'frame_removed' && fid) {
      await supabase
        .from('player_profiles')
        .update({ notification_token: null, notification_url: null })
        .eq('fid', fid);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Webhook error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
