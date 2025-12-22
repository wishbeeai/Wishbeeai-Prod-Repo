import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: gifts, error } = await supabase
      .from('group_gifts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ gifts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, targetAmount, recipientName } = await request.json();

    const { data: gift, error } = await supabase
      .from('group_gifts')
      .insert([{ 
        organizer_id: user.id, 
        title, 
        target_amount: targetAmount, 
        recipient_name: recipientName 
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ gift }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
