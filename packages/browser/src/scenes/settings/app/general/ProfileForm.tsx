import { zodResolver } from '@hookform/resolvers/zod'
import { useUpdateUser } from '@stump/client'
import { Button, Form, Input, Text } from '@stump/components'
import { useLocaleContext } from '@stump/i18n'
import { isUrl } from '@stump/sdk'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { z } from 'zod'

import { useUser } from '@/stores'

import AvatarPicker from './AvatarPicker'

// TODO(testing): extract schema and test components individually

export default function ProfileForm() {
	const { t } = useLocaleContext()
	const { updateAsync } = useUpdateUser()

	const { user, setUser } = useUser()

	const schema = z.object({
		avatarUrl: z
			.string()
			.optional()
			.nullable()
			.refine(
				(url) => !url || isUrl(url),
				() => ({
					message: t('settingsScene.app/account.sections.account.validation.invalidUrl'),
				}),
			),
		name: z.string().optional(),
		password: z.string().optional(),
		username: z.string().min(1, {
			message: t('settingsScene.app/account.sections.account.validation.missingUsername'),
		}),
	})
	type Schema = z.infer<typeof schema>

	const form = useForm<Schema>({
		defaultValues: {
			avatarUrl: user!.avatar_url,
			username: user!.username,
		},
		mode: 'onSubmit',
		resolver: zodResolver(schema),
	})

	const [avatarUrl, newUsername, newPassword] = form.watch(['avatarUrl', 'username', 'password'], {
		avatarUrl: user?.avatar_url,
		username: user?.username,
	})

	const isChangingPassword = !!newPassword
	const hasChanges =
		avatarUrl !== user?.avatar_url || newUsername !== user?.username || isChangingPassword

	const handleImageChange = (url?: string) => {
		form.setValue('avatarUrl', url, { shouldValidate: true })
	}

	const handleSubmit = async (values: Schema) => {
		if (!hasChanges || !user) return

		try {
			await updateAsync(
				{
					...user,
					age_restriction: user.age_restriction || null,
					avatar_url: values.avatarUrl || null,
					password: values.password || null,
					username: values.username,
				},
				{
					onSuccess: (user) => {
						setUser(user)
						form.reset({
							avatarUrl: user.avatar_url,
							...user,
						})
					},
				},
			)
		} catch (error) {
			console.error(error)
			toast.error(t('settingsScene.app/account.sections.account.errors.updateFailed'))
		}
	}

	return (
		<Form form={form} onSubmit={handleSubmit}>
			<div className="flex w-full flex-col-reverse space-y-8 space-y-reverse md:max-w-2xl md:flex-row md:justify-between md:space-y-0">
				<div className="flex flex-grow flex-col gap-6">
					<Input
						variant="primary"
						className="w-full"
						containerClassName="max-w-full md:max-w-sm"
						label={t('settingsScene.app/account.sections.account.labels.username')}
						autoComplete="username"
						{...form.register('username')}
					/>
					<Input
						variant="primary"
						className="w-full"
						containerClassName="max-w-full md:max-w-sm"
						label={t('settingsScene.app/account.sections.account.labels.password')}
						type="password"
						autoComplete="new-password"
						{...form.register('password')}
					/>

					<div className="flex w-full flex-col items-center gap-4 md:flex-row">
						<Button variant="primary" type="submit" className="w-full md:w-[unset]">
							{t('settingsScene.app/account.sections.account.buttons.confirm')}
						</Button>

						{hasChanges && (
							<Text variant="muted" size="xs">
								{t('settingsScene.app/account.sections.account.labels.activeChangesPrompt')}
							</Text>
						)}
					</div>
				</div>

				<input className="hidden" {...form.register('avatarUrl')} />
				<AvatarPicker
					imageUrl={avatarUrl}
					fallback={user?.username}
					onImageChange={handleImageChange}
				/>
			</div>
		</Form>
	)
}
