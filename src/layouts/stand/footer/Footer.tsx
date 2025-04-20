import { useState } from 'react';
import { Container } from '@/components/container';
import { generalSettings } from '@/config';
import { AdMiscFaqModal } from '@/partials/misc/AdMiscFaqModal';

const Footer = () => {
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  
  return (
    <footer className="footer">
      <Container>
        <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-3 py-5">
          <div className="flex order-2 md:order-1  gap-2 font-normal text-2sm">
            <span className="text-gray-500">2025 &copy;</span>
            <a
              href="#"
              className="text-gray-600 hover:text-primary"
            >
              The Standard of Marketing
            </a>
          </div>
          <nav className="flex order-1 md:order-2 gap-4 font-normal text-2sm text-gray-600">
            {/* 일반 텍스트 형태로 복원하되, 클릭 시 모달 오픈 */}
            <a 
              href="#" 
              className="hover:text-primary"
              onClick={(e) => {
                e.preventDefault();
                setIsFaqModalOpen(true);
              }}
            >
              FAQ
            </a>
          </nav>
        </div>
      </Container>
      
      {/* FAQ 모달 */}
      <AdMiscFaqModal 
        isOpen={isFaqModalOpen} 
        onClose={() => setIsFaqModalOpen(false)} 
      />
    </footer>
  );
};

export { Footer };