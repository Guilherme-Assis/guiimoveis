import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle()
      .then(({ data }) => {
        setPost(data);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-body text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Header />
        <p className="font-display text-2xl text-foreground">Artigo não encontrado</p>
        <Link to="/blog" className="mt-4 font-body text-primary hover:underline">Voltar ao blog</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {post.cover_image_url && (
        <section className="relative h-[40vh] w-full overflow-hidden">
          <img src={post.cover_image_url} alt={post.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </section>
      )}

      <article className="container mx-auto max-w-3xl px-6 py-12">
        <Link to="/blog" className="mb-6 inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Voltar ao blog
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-4 flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-body text-sm">
              {new Date(post.published_at || post.created_at).toLocaleDateString("pt-BR")}
            </span>
          </div>

          <h1 className="mb-6 font-display text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          <div className="prose prose-invert max-w-none font-body text-muted-foreground leading-relaxed [&_h2]:font-display [&_h2]:text-foreground [&_h2]:text-2xl [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:font-display [&_h3]:text-foreground [&_h3]:text-xl [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:mb-4 [&_ul]:mb-4 [&_ol]:mb-4 [&_li]:mb-1">
            {post.content.split("\n").map((paragraph: string, i: number) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </motion.div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogPost;
