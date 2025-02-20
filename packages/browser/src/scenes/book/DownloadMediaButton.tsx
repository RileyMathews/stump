import { useSDK } from '@stump/client'
import { Button, IconButton } from '@stump/components'
import { Media } from '@stump/sdk'
import { DownloadCloud } from 'lucide-react'
import { useMediaMatch } from 'rooks'

import { formatBookName } from '@/utils/format'

type Props = {
	media: Media
}
export default function DownloadMediaButton({ media }: Props) {
	const { sdk } = useSDK()
	const isAtLeastMedium = useMediaMatch('(min-width: 768px)')

	const bookTitle = formatBookName(media)

	const renderButton = () => {
		if (isAtLeastMedium) {
			return (
				<IconButton size="sm" variant="ghost" title={`Download ${bookTitle}`}>
					<DownloadCloud size="1.25rem" />
				</IconButton>
			)
		} else {
			return (
				<Button className="w-full" variant="ghost" title={`Download ${bookTitle}`}>
					<DownloadCloud size="1.25rem" className="mr-2" /> Download Book
				</Button>
			)
		}
	}

	return (
		<a href={sdk.media.downloadURL(media.id)} download>
			{renderButton()}
		</a>
	)
}
