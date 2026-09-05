export const onRequest = async ({ request, next }) => {
  const url = new URL(request.url);
  if (url.hostname === 'portal-0bx.pages.dev') {
    return Response.redirect(`https://squintum.com${url.pathname}${url.search}`, 301);
  }
  return next();
};
