'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

function SummaryCard({ index, item }: { index?: number, item: { title: string, icon: ReactNode, value: string, percentage?: number, href?: string } }) {
    const params = useParams();

    const card = <Card key={index ?? Math.random().toString()} className={`${item.href && 'hover:bg-secondary'} transition-all duration-300`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
                {item.title}
            </CardTitle>
            {item.icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">
                {item.value}
            </div>
            <p className="text-xs text-muted-foreground">
                {item.percentage}
            </p>
        </CardContent>
    </Card>

    if (item.href) {
        return (
            <Link href={`${item.href}`}>
                {card}
            </Link>
        )
    } else {
        return card
    }
}


export default SummaryCard