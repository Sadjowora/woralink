'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';

type GalleryUploadProps = {
	value: string[];
	onChange: (urls: string[]) => void;
	maxPhotos?: number;
	className?: string;
};

export default function GalleryUpload({
	value,
	onChange,
	maxPhotos = 5,
	className = '',
}: GalleryUploadProps) {
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleSelectFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			setError('Veuillez sélectionner une image valide.');
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			setError('La taille du fichier ne doit pas dépasser 5MB.');
			return;
		}

		if (value.length >= maxPhotos) {
			setError(`Vous ne pouvez pas dépasser ${maxPhotos} photos.`);
			return;
		}

		setUploading(true);
		setError(null);

		try {
			const fileExt = file.name.split('.').pop() ?? 'png';
			const fileName = `gallery-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

			const { error: uploadError } = await supabase.storage
				.from('company-media')
				.upload(fileName, file, {
					cacheControl: '3600',
					upsert: false,
				});

			if (uploadError) {
				throw uploadError;
			}

			const { data: publicUrlData } = supabase.storage
				.from('company-media')
				.getPublicUrl(fileName);

			if (!publicUrlData?.publicUrl) {
				throw new Error('Impossible de récupérer l\'URL publique.');
			}

			onChange([...value, publicUrlData.publicUrl]);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Erreur lors de l\'upload de la photo.';
			setError(message);
		} finally {
			setUploading(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		}
	};

	const handleRemove = (indexToRemove: number) => {
		onChange(value.filter((_, index) => index !== indexToRemove));
	};

	return (
		<div className={`space-y-3 ${className}`}>
			<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
				{value.map((url, index) => (
					<div key={`${url}-${index}`} className="relative">
						<Image
							src={url}
							alt={`Photo galerie ${index + 1}`}
							width={180}
							height={180}
							className="w-full h-28 object-cover rounded-lg border"
						/>
						<button
							type="button"
							onClick={() => handleRemove(index)}
							className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs hover:bg-red-600"
							title="Supprimer"
						>
							x
						</button>
					</div>
				))}

				{value.length < maxPhotos && (
					<label className="h-28 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-sm text-gray-600 cursor-pointer hover:border-blue-400">
						{uploading ? 'Upload...' : 'Ajouter une photo'}
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={handleSelectFile}
							disabled={uploading}
							className="hidden"
						/>
					</label>
				)}
			</div>

			<p className="text-xs text-gray-500">
				{value.length}/{maxPhotos} photo(s) ajoutée(s)
			</p>

			{error && (
				<div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
					{error}
				</div>
			)}
		</div>
	);
}
