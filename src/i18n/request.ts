import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { LOCALE_COOKIE, defaultLocale, isLocale } from "./config";

// No locale prefix in URLs: the language comes from a cookie that mirrors profiles.locale (ACC-02).
export default getRequestConfig(async () => {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(stored) ? stored : defaultLocale;
  return {
    locale,
    timeZone: "Asia/Jayapura",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
