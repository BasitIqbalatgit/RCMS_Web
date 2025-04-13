
import Link from 'next/link'
import React from 'react'

const Footer = () => {
  return (
    <section className='container mx-auto flex flex-col gap-2 sm:flex-row  py-6 w-full items-center'>
        <p className='text-xs text-muted-foreground'>
            &copy;  {new Date().getFullYear()} RCMS AI Inc. All rights reserved.
        </p>
        <nav className='sm:ml-auto sm:gap-6 gap-4 flex '>
            <Link href='#' className='text-xs hover:underline underline-offset-4'>
            Term of Services</Link>
            <Link href='#' className='text-xs hover:underline underline-offset-4'>
                Privacy Policy
            </Link>
        </nav>
    </section>
  )
}

export default Footer
