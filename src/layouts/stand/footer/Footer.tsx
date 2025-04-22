import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/container';
import { generalSettings } from '@/config';
import { AdMiscFaqModal } from '@/partials/misc/AdMiscFaqModal';

const Footer = () => {
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  
  return (
    <footer className="footer">
      <Container>
        <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-3 py-5">
          <div className="flex order-2 md:order-1 gap-2 font-normal text-2sm">
            <span className="text-gray-500">2025 &copy;</span>
            <a
              href="#"
              className="text-gray-600 hover:text-primary"
            >
              The Standard of Marketing
            </a>
          </div>
          <nav className="flex order-1 md:order-2 gap-4 font-normal text-2sm text-gray-600">
            {/* FAQ 링크 */}
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
            
            {/* 사이트맵 링크 추가 */}
            <Link 
              to="/sitemap" 
              className="hover:text-primary"
            >
              사이트맵
            </Link>
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