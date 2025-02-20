import { zodResolver } from '@hookform/resolvers/zod'
import {
	invalidateQueries,
	useCreateEmailDevice,
	useSDK,
	useUpdateEmailDevice,
} from '@stump/client'
import { Button, CheckBox, Dialog, Form, Input } from '@stump/components'
import { useLocaleContext } from '@stump/i18n'
import { RegisteredEmailDevice } from '@stump/sdk'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'

type Props = {
	isOpen: boolean
	updatingDevice: RegisteredEmailDevice | null
	onClose: () => void
}

// TODO: unique constraint on name...
// TODO: fix types here
export default function CreateOrUpdateDeviceModal({ isOpen, updatingDevice, onClose }: Props) {
	const { sdk } = useSDK()
	const { t } = useLocaleContext()

	const { createAsync } = useCreateEmailDevice()
	const { updateAsync } = useUpdateEmailDevice({
		id: updatingDevice?.id || -1,
	})

	const defaultValues = useMemo(
		() => ({
			email: updatingDevice?.email || '',
			forbidden: updatingDevice?.forbidden || false,
			name: updatingDevice?.name || '',
		}),
		[updatingDevice],
	)

	const form = useForm({
		defaultValues,
		resolver: zodResolver(schema),
	})
	const { reset } = form

	const isForbidden = form.watch('forbidden')

	useEffect(() => {
		reset(defaultValues)
	}, [defaultValues, reset, updatingDevice])

	const handleSubmit = async (values: z.infer<typeof schema>) => {
		try {
			if (updatingDevice) {
				await updateAsync(values)
			} else {
				await createAsync(values)
			}
			onClose()
		} catch (error) {
			console.error(error)
			toast.error('Failed to create/update device')
		}
		await invalidateQueries({ keys: [sdk.emailer.keys.getDevices] })
	}

	const onOpenChange = (nowOpen: boolean) => (!nowOpen ? onClose() : null)

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<Dialog.Content size="md">
				<Dialog.Header>
					<Dialog.Title>
						{t(updatingDevice ? getKey('title.update') : getKey('title.create'))}
					</Dialog.Title>
					<Dialog.Close onClick={onClose} />
				</Dialog.Header>
				<div className="flex flex-col gap-y-2 py-2 scrollbar-hide">
					<Form form={form} onSubmit={handleSubmit} id="create-or-update-device-form">
						<Input
							label={t(getKey('name.label'))}
							description={t(getKey('name.description'))}
							variant="primary"
							{...form.register('name')}
							ignoreFill
						/>
						<Input
							label={t(getKey('email.label'))}
							description={t(getKey('email.description'))}
							variant="primary"
							{...form.register('email')}
							ignoreFill
						/>
						<CheckBox
							label={t(getKey('forbidden.label'))}
							description={t(getKey('forbidden.description'))}
							variant="primary"
							checked={isForbidden}
							onClick={() => form.setValue('forbidden', !isForbidden)}
						/>
					</Form>
				</div>

				<Dialog.Footer>
					<Button variant="default" onClick={onClose}>
						Cancel
					</Button>
					<Button variant="primary" type="submit" form="create-or-update-device-form">
						{t(updatingDevice ? getKey('submit.update') : getKey('submit.create'))}
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog>
	)
}

const schema = z.object({
	email: z.string().email(),
	forbidden: z.boolean().default(false),
	name: z.string(),
})

const LOCALE_BASE = 'settingsScene.server/email.sections.devices.addOrUpdateDevice'
const getKey = (key: string) => `${LOCALE_BASE}.${key}`
