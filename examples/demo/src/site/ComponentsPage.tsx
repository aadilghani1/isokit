import type { ReactNode } from "react"
import { type ComponentDoc, DOCS, docBySlug } from "./docs"
import { EXAMPLES } from "./examples"
import { FIGURES } from "./registry"
import { href } from "./route"

const GROUPS = ["Drawing", "Guided motion", "Sound", "Geometry"] as const

function Sidebar({ current }: { current: string | undefined }): ReactNode {
  return (
    <nav className="docs-nav" aria-label="Components">
      {GROUPS.map((group) => (
        <div key={group}>
          <p className="eyebrow">{group}</p>
          <ul>
            {DOCS.filter((doc) => doc.group === group).map((doc) => (
              <li key={doc.slug}>
                <a href={href("components", doc.slug)} aria-current={current === doc.slug ? "page" : undefined}>
                  <code>{doc.name}</code>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function Detail({ doc }: { doc: ComponentDoc }): ReactNode {
  const Example = EXAMPLES[doc.slug]
  const usedBy = FIGURES.filter((figure) => figure.uses.some((name) => doc.name.split(", ").includes(name) || doc.slug === name.toLowerCase()))
  return (
    <article className="docs-detail">
      <p className="eyebrow">
        {doc.group} · {doc.kind}
      </p>
      <h1>
        <code>{doc.name}</code>
      </h1>
      <p className="lede">{doc.summary}</p>
      <pre className="signature">
        <code>{doc.signature}</code>
      </pre>
      {Example ? (
        <div className="docs-example">
          <Example />
        </div>
      ) : null}
      <h2>{doc.kind === "Hook" ? "Arguments and result" : "Props"}</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Type</th>
              <th scope="col">Default</th>
              <th scope="col">What it does</th>
            </tr>
          </thead>
          <tbody>
            {doc.props.map((prop) => (
              <tr key={prop.name}>
                <td>
                  <code>{prop.name}</code>
                </td>
                <td>
                  <code>{prop.type}</code>
                </td>
                <td>{prop.fallback ? <code>{prop.fallback}</code> : "—"}</td>
                <td>{prop.about}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>Usage</h2>
      <pre>
        <code>{doc.usage}</code>
      </pre>
      <h2>Notes</h2>
      <ul className="notes">
        {doc.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      {usedBy.length ? (
        <>
          <h2>In the figures</h2>
          <ul className="chips">
            {usedBy.map((figure) => (
              <li key={figure.slug}>
                <a href={href("figures", figure.slug)}>{figure.title}</a>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </article>
  )
}

function Overview(): ReactNode {
  return (
    <article className="docs-detail">
      <p className="eyebrow">Components · {DOCS.length} pages</p>
      <h1>Everything in the kit.</h1>
      <p className="lede">Three components draw a figure, five guide a first-time reader through it, and a few functions do the projection underneath. Each page has a live example, its props and the rules that keep a figure honest.</p>
      <div className="docs-cards">
        {DOCS.map((doc) => (
          <a key={doc.slug} className="docs-card" href={href("components", doc.slug)}>
            <span className="eyebrow">{doc.group}</span>
            <code>{doc.name}</code>
            <span>{doc.summary}</span>
          </a>
        ))}
      </div>
    </article>
  )
}

export function ComponentsPage({ slug }: { slug: string | undefined }): ReactNode {
  const doc = docBySlug(slug)
  return (
    <main className="page docs">
      <Sidebar current={doc?.slug} />
      {doc ? <Detail key={doc.slug} doc={doc} /> : <Overview />}
    </main>
  )
}
