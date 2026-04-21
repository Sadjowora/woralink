import { FaWhatsapp } from 'react-icons/fa';

interface WhatsAppButtonProps {
  phoneNumber: string;
  companyName: string;
}

export default function WhatsAppButton({ phoneNumber, companyName }: WhatsAppButtonProps) {
  // Nettoyage du numéro (enlever les espaces, +, etc.)
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Message pré-rempli encodé pour l'URL
  const message = encodeURIComponent(
    `Bonjour ${companyName}, j'ai vu votre profil sur Woralink et je souhaite obtenir des informations.`
  );

  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-full font-bold hover:bg-[#128C7E] transition-colors shadow-lg w-full md:w-auto"
    >
      <FaWhatsapp size={24} />
      Contacter sur WhatsApp
    </a>
  );
}