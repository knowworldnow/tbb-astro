import type React from "react"
import { PortableText as BasePortableText } from "@portabletext/react"
import type { PortableTextReactComponents, PortableTextComponentProps } from "@portabletext/react"
import type { PortableTextBlock } from "@portabletext/types"
// Using a plain <img> to preserve natural aspect ratio and avoid forced dimensions
import { urlFor } from "../lib/sanity"
import { getHeadingId } from "../lib/toc"
import type { TableData } from "../types"

// Define proper types for the image value
interface ImageValue {
  _type: "image"
  asset: {
    _ref: string
  }
  alt?: string
  caption?: string
}

// Define proper types for link values
interface LinkValue {
  _type: "link"
  href: string
  blank?: boolean
}

const components: Partial<PortableTextReactComponents> = {
  types: {
    image: ({ value }: { value: ImageValue }) => {
      if (!value?.asset) {
        return (
          <div className="my-6 sm:my-8 p-3 sm:p-4 border border-amber-300 rounded-lg bg-amber-50">
            <p className="text-amber-700 text-sm sm:text-base">Image asset not found</p>
          </div>
        )
      }

      try {
        const imageUrl = urlFor(value).fit('max').auto('format').quality(85).url()

        return (
          <div className="my-6 sm:my-8">
            <div className="rounded-lg shadow-lg">
              <img
                src={imageUrl}
                alt={value?.alt || "Blog image"}
                className="mx-auto w-[60%] max-w-full h-auto"
                loading="lazy"
              />
            </div>
            {value?.caption && (
              <p className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3 text-center italic font-medium">
                {value.caption}
              </p>
            )}
          </div>
        )
      } catch (error) {
        console.error('Error generating image URL:', error)
        return (
          <div className="my-6 sm:my-8 p-3 sm:p-4 border border-red-300 rounded-lg bg-red-50">
            <p className="text-red-600 font-medium text-sm sm:text-base">Error loading image</p>
            <p className="text-xs sm:text-sm text-red-500 mt-1">Please check the image configuration</p>
          </div>
        )
      }
    },
    table: ({ value }: { value: TableData }) => {
      let tableData: string[][] = []

      try {
        // Add debugging
        console.log('Table value received:', value)
        console.log('Table data type:', typeof value.tableData)
        
        tableData = JSON.parse(value.tableData)
        console.log('Parsed table data:', tableData)
        
        // Validate table structure
        if (!Array.isArray(tableData)) {
          console.error('Table data is not an array:', tableData)
          return <p className="text-red-500 dark:text-red-400">Invalid table data format</p>
        }
        
        if (tableData.length === 0) {
          console.log('Table data is empty')
          return <p className="text-red-500 dark:text-red-400">No table data available</p>
        }
        
        // Validate each row is an array of strings
        for (let i = 0; i < tableData.length; i++) {
          const row = tableData[i]
          if (!Array.isArray(row)) {
            console.error(`Row ${i} is not an array:`, row)
            return <p className="text-red-500 dark:text-red-400">Invalid table row format</p>
          }
          
          // Convert all cells to strings to prevent React error #31
          for (let j = 0; j < row.length; j++) {
            if (row[j] !== null && row[j] !== undefined) {
              row[j] = String(row[j])
            } else {
              row[j] = ''
            }
          }
        }
        
      } catch (error) {
        console.error('Error parsing table data:', error)
        return <p className="text-red-500 dark:text-red-400">Invalid table data</p>
      }

      const headers = value.hasHeader ? tableData[0] : []
      const rows = value.hasHeader ? tableData.slice(1) : tableData

      return (
        <div className="my-8">
          {value.title && (
            <h3 className="text-lg font-bold mb-4 text-gray-900 bg-gradient-to-r from-amber-600 to-yellow-700 bg-clip-text text-transparent">
              {String(value.title)}
            </h3>
          )}
          <div className="rounded-lg shadow-lg overflow-hidden border border-amber-200">
            {/* Mobile-friendly table wrapper with horizontal scroll */}
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse bg-white">
                {value.hasHeader && headers.length > 0 && (
                  <thead className="bg-gradient-to-r from-amber-500 to-yellow-600">
                    <tr>
                      {headers.map((header, index) => (
                        <th
                          key={`header-${index}`}
                          className="border-r border-amber-300 last:border-r-0 px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left font-bold text-white text-xs sm:text-sm uppercase tracking-wide whitespace-nowrap"
                        >
                          {String(header)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody className="divide-y divide-amber-100">
                  {rows.map((row, rowIndex) => (
                    <tr 
                      key={`row-${rowIndex}`} 
                      className={`transition-colors hover:bg-amber-50 ${
                        rowIndex % 2 === 0 ? 'bg-white' : 'bg-gradient-to-r from-amber-25 to-yellow-25'
                      }`}
                    >
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`cell-${rowIndex}-${cellIndex}`}
                          className="border-r border-amber-100 last:border-r-0 px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-900 font-medium text-xs sm:text-sm whitespace-nowrap"
                        >
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    },
  },
  marks: {
    link: ({ children, value }: { children: React.ReactNode; value?: LinkValue }) => {
      const target = value?.blank ? "_blank" : undefined
      return (
        <a
          href={value?.href}
          target={target}
          rel={target === "_blank" ? "noopener noreferrer" : undefined}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
        >
          {children}
        </a>
      )
    },
  },
  block: {
    normal: (props: PortableTextComponentProps<PortableTextBlock>) => (
      <p className="mb-4 leading-relaxed text-gray-900 dark:text-gray-100 text-sm sm:text-base">{props.children}</p>
    ),
    h2: (props: PortableTextComponentProps<PortableTextBlock>) => {
      const text = props.children?.toString() || ''
      const id = getHeadingId(text)
      return (
        <h2 id={id} className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 mt-6 sm:mt-8 text-gray-900 dark:text-white scroll-mt-8">
          {props.children}
        </h2>
      )
    },
    h3: (props: PortableTextComponentProps<PortableTextBlock>) => {
      const text = props.children?.toString() || ''
      const id = getHeadingId(text)
      return (
        <h3 id={id} className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 mt-4 sm:mt-6 text-gray-900 dark:text-white scroll-mt-8">
          {props.children}
        </h3>
      )
    },
    h4: (props: PortableTextComponentProps<PortableTextBlock>) => {
      const text = props.children?.toString() || ''
      const id = getHeadingId(text)
      return (
        <h4 id={id} className="text-base sm:text-lg font-bold mb-2 sm:mb-3 mt-3 sm:mt-6 text-gray-900 dark:text-white scroll-mt-8">
          {props.children}
        </h4>
      )
    },
    h5: (props: PortableTextComponentProps<PortableTextBlock>) => {
      const text = props.children?.toString() || ''
      const id = getHeadingId(text)
      return (
        <h5 id={id} className="text-sm sm:text-base font-bold mb-1 sm:mb-2 mt-3 sm:mt-4 text-gray-900 dark:text-white scroll-mt-8">
          {props.children}
        </h5>
      )
    },
    h6: (props: PortableTextComponentProps<PortableTextBlock>) => {
      const text = props.children?.toString() || ''
      const id = getHeadingId(text)
      return (
        <h6 id={id} className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 mt-2 sm:mt-4 text-gray-900 dark:text-white scroll-mt-8">
          {props.children}
        </h6>
      )
    },
    blockquote: (props: PortableTextComponentProps<PortableTextBlock>) => (
      <blockquote className="relative border-l-4 border-gradient-to-b from-amber-400 to-yellow-600 bg-gradient-to-r from-amber-50/50 to-yellow-50/30 pl-4 sm:pl-6 pr-3 sm:pr-4 py-3 sm:py-4 my-4 sm:my-6 rounded-r-lg shadow-md">
        {/* Casino-style quote decoration */}
        <div className="absolute top-2 left-2 w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-xs">"</span>
        </div>
        <div className="ml-3 sm:ml-4 italic text-gray-800 font-medium leading-relaxed text-sm sm:text-base">
          {props.children}
        </div>
        {/* Subtle accent border */}
        <div className="absolute inset-0 rounded-r-lg border border-amber-200/40 pointer-events-none"></div>
      </blockquote>
    ),
  },
  list: {
    bullet: (props: PortableTextComponentProps<unknown>) => (
      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-900 dark:text-gray-100 text-sm sm:text-base">{props.children}</ul>
    ),
    number: (props: PortableTextComponentProps<unknown>) => (
      <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-900 dark:text-gray-100 text-sm sm:text-base">{props.children}</ol>
    ),
  },
  listItem: {
    bullet: (props: PortableTextComponentProps<unknown>) => (
      <li className="mb-1 text-gray-900 dark:text-gray-100">{props.children}</li>
    ),
    number: (props: PortableTextComponentProps<unknown>) => (
      <li className="mb-1 text-gray-900 dark:text-gray-100">{props.children}</li>
    ),
  },
}

// FIXED: Updated interface to accept both 'content' and 'value' props
interface PortableTextProps {
  content?: PortableTextBlock[]
  value?: PortableTextBlock[]
}

export default function PortableTextComponent({ content, value }: PortableTextProps) {
  // Use whichever prop is provided
  const textContent = content || value

  if (!textContent) {
    return null
  }

  return <BasePortableText value={textContent} components={components} />
}
