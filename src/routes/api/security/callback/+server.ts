import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import {
  decodeAuthorizationState,
  OAUTH2_CODE_PARAM,
  OAUTH2_ERROR_PARAM,
  OAUTH2_STATE_PARAM,
  resolveSafeReturnUrl,
} from '$lib/restful/security/oauth2Pkce';
import { withAppBase } from '$lib/utils/app-base';

/** OAuth2 redirect target: forwards code/state to the app page that started the flow. */
export const GET = ({ url }: RequestEvent) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error_description') ?? url.searchParams.get('error');
  const decoded = decodeAuthorizationState(state);
  const target = resolveSafeReturnUrl(decoded?.returnUrl, url.origin, withAppBase('/'));
  if (error) {
    target.searchParams.set(OAUTH2_ERROR_PARAM, error);
  } else if (code && state) {
    target.searchParams.set(OAUTH2_CODE_PARAM, code);
    target.searchParams.set(OAUTH2_STATE_PARAM, state);
  } else {
    target.searchParams.set(OAUTH2_ERROR_PARAM, 'missing code or state');
  }
  redirect(302, target.toString());
};
