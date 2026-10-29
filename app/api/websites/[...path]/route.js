import { NextResponse } from 'next/server';
import * as upload from '@/lib/websites/routes/upload';
import * as uploadVerify from '@/lib/websites/routes/upload-verify';
import * as submit from '@/lib/websites/routes/submit';
import * as payfastInit from '@/lib/websites/routes/payfast-init';
import * as payfastNotify from '@/lib/websites/routes/payfast-notify';
import * as adminList from '@/lib/websites/routes/admin-list';
import * as adminItem from '@/lib/websites/routes/admin-item';
import * as trainingList from '@/lib/websites/routes/training-list';
import * as trainingItem from '@/lib/websites/routes/training-item';
import * as reviews from '@/lib/websites/routes/reviews';
import * as reviewsAdmin from '@/lib/websites/routes/reviews-admin';

export const runtime = 'nodejs';

// ONE serverless function for every /api/websites/* endpoint.
// The Vercel Hobby plan allows 12 functions per deployment and the shop already uses most of them,
// so the handlers live in lib/websites/routes/ and are dispatched from here.
const FIXED = {
  'upload': upload,
  'upload/verify': uploadVerify,
  'submit': submit,
  'payfast/init': payfastInit,
  'payfast/notify': payfastNotify,
  'admin/list': adminList,
  'training/list': trainingList,
  'reviews': reviews,
  'reviews/admin': reviewsAdmin,
};

function dispatch(method) {
  return async (req, { params }) => {
    const path = (params.path || []).join('/');
    let mod = FIXED[path];
    let ctx = { params: {} };
    if (!mod && params.path?.length === 2 && params.path[0] === 'admin') {
      mod = adminItem;
      ctx = { params: { id: params.path[1] } };
    } else if (!mod && params.path?.length === 2 && params.path[0] === 'training') {
      mod = trainingItem;
      ctx = { params: { id: params.path[1] } };
    } else if (!mod && params.path?.length === 3 && params.path[0] === 'reviews' && params.path[1] === 'admin') {
      mod = reviewsAdmin;
      ctx = { params: { id: params.path[2] } };
    }
    const handler = mod?.[method];
    if (!handler) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return handler(req, ctx);
  };
}

export const GET = dispatch('GET');
export const POST = dispatch('POST');
export const PATCH = dispatch('PATCH');
export const DELETE = dispatch('DELETE');
