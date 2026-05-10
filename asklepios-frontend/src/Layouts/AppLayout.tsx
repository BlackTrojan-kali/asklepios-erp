import React, { type ReactNode } from 'react'
import Header from '../components/Header'

const AppLayout = ({children}:{children:ReactNode}) => {
  return (
    <>
    <div>
        <Header></Header>
    </div>
    <div>
        sidebar
    </div>
    <div>
    {children}
    </div>
    </>
  )
}

export default AppLayout