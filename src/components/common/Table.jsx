import React from 'react'
import './Table.css'

export default function Table({
  children,
  hoverable = true,
  className = '',
  containerClassName = '',
  ...rest
}) {
  return (
    <div className={`lexi-table-container ${containerClassName}`}>
      <table
        className={`lexi-table ${hoverable ? 'lexi-table--hover' : ''} ${className}`}
        {...rest}
      >
        {children}
      </table>
    </div>
  )
}
