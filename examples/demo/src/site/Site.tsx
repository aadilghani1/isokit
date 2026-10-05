import { type ReactNode, useEffect } from "react"
import { App } from "../App"
import { ComponentsPage } from "./ComponentsPage"
import { FiguresPage } from "./FiguresPage"
import { useRoute } from "./route"
import { SiteFooter, SiteHeader } from "./SiteChrome"
import { SoundPage } from "./SoundPage"

const PAGES = ["figures", "components", "sound"] as const
type Page = (typeof PAGES)[number]
const isPage = (segment: string | undefined): segment is Page => PAGES.some((page) => page === segment)

function PageBody({ page, slug }: { page: Page; slug: string | undefined }): ReactNode {
  switch (page) {
    case "figures":
      return <FiguresPage slug={slug} />
    case "components":
      return <ComponentsPage slug={slug} />
    case "sound":
      return <SoundPage focus={slug} />
  }
}

/** Hash routes, so deep links work on GitHub Pages: #/figures, #/components/<name>, #/sound. Anything else is the home page, which keeps in-page anchors like #agent working. */
export function Site(): ReactNode {
  const [page, slug] = useRoute()
  const where = isPage(page) ? `${page}/${slug ?? ""}` : null
  useEffect(() => {
    if (where) window.scrollTo({ top: 0 })
  }, [where])
  if (!isPage(page)) return <App />
  return (
    <>
      <SiteHeader current={page} />
      <PageBody page={page} slug={slug} />
      <SiteFooter />
    </>
  )
}
