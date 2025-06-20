import React from 'react';
import './MediaCarousel.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import { motion } from 'framer-motion';
import { FaRocket, FaCogs, FaCloud } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

const MediaCarousel = ({ mediaItems }) => {
  const { t } = useTranslation();

  return (
    <div className="media-carousel">
      <Swiper
        modules={[Pagination, Navigation, Autoplay, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        pagination={{ clickable: true }}
        navigation
        autoplay={{
          delay: 4000,
          pauseOnMouseEnter: true,
          disableOnInteraction: false,
        }}
        loop
        grabCursor
        slidesPerView={1}
        touchRatio={1.2}
        threshold={10}
      >
        {mediaItems.map((item, idx) => (
          <SwiperSlide key={idx}>
            {item.type === 'image' && (
              <>
                <img
                  src={item.src}
                  alt={t(item.alt || 'mediaCarousel.imageAlt')}
                  className="media-item"
                  loading="lazy"
                />
                {item.caption && <p className="slide-caption">{t(item.caption)}</p>}
              </>
            )}

            {item.type === 'video' && (
              <>
                <video
                  src={item.src}
                  muted
                  autoPlay
                  loop
                  playsInline
                  controls
                  className="media-item"
                  style={{ width: '100%', height: '100%' }}
                  poster={item.poster || '/assets/fallback-poster.jpg'}
                >
                  {t('mediaCarousel.videoFallback')}
                </video>
                {item.caption && <p className="slide-caption">{t(item.caption)}</p>}
              </>
            )}

            {item.type === 'iframe' && (
              <>
                <div className="iframe-wrapper">
                  <iframe
                    src={`${item.src}?rel=0&modestbranding=1`}
                    title={`YouTube Video ${idx}`}
                    className="iframe-item"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                {item.caption && <p className="slide-caption">{t(item.caption)}</p>}
              </>
            )}

            {item.type === 'custom' && (
              <motion.div
                className="custom-slide"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="custom-content">
                  <div className="icon-stack">
                    <FaRocket />
                    <FaCogs />
                    <FaCloud />
                  </div>
                  <h2>{t('mediaCarousel.customTitle')}</h2>
                  <p>{t('mediaCarousel.customDesc')}</p>
                </div>
              </motion.div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default MediaCarousel;
