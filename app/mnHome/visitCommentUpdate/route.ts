import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { updateVisitComment } from '@/lib/db/repo';
import { sanitizePlainText } from '@/lib/sanitize';

/** 구 VisitController.visitCommentUpdate */
export async function POST(request: Request) {
  try {
    const { originalContent, newContent, targetNickname } = (await request.json()) as {
      originalContent?: string;
      newContent?: string;
      targetNickname?: string;
    };

    const user = await getSessionUser();
    if (!user || !targetNickname || originalContent == null || !newContent?.trim()) {
      return NextResponse.json({ result: 'Fail' });
    }

    const updated = await updateVisitComment({
      userNickname: user.userNickname,
      targetNickname,
      originalContent,
      newContent: sanitizePlainText(newContent),
    });
    return NextResponse.json({ result: updated === 1 ? 'Success' : 'Fail' });
  } catch (error) {
    console.error('[visitCommentUpdate]', error);
    return NextResponse.json({ result: 'Fail' });
  }
}
