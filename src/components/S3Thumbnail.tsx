import { useS3Image } from "@/hooks/useS3Image";

interface S3ThumbnailProps {
  url: string;
  alt: string;
  className?: string;
}

const S3Thumbnail = ({ url, alt, className = "h-16 w-24 rounded object-cover" }: S3ThumbnailProps) => {
  const resolved = useS3Image(url);
  return <img src={resolved} alt={alt} className={className} loading="lazy" />;
};

export default S3Thumbnail;
