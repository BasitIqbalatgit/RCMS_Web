import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const Logo = () => {
  return (
    <Link href='/' className='flex items-center gap-2'>
        <Sparkles className='h-6 w-6' strokeWidth={1.5}/>
        <span className='font-bold text-md'>Rcms Ai</span>
    </Link>
  )
}

export default Logo