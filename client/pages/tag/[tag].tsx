import React, { useState, useCallback, useEffect } from "react";
import { NextPage } from "next";
import cls from "classnames";
import InfiniteScroll from "react-infinite-scroller";
import { useSetting } from "@/hooks/useSetting";
import { ArticleProvider } from "@providers/article";
import { Layout } from "@/layout/Layout";
import { CategoryMenu } from "@components/CategoryMenu";
import { ArticleList } from "@components/ArticleList";
import { RecommendArticles } from "@components/RecommendArticles";
import { Tags } from "@components/Tags";
import { Footer } from "@components/Footer";
import style from "../index.module.scss";

interface IProps {
  articles: IArticle[];
  total: number;
  tag: string;
}

const pageSize = 12;

const Home: NextPage<IProps> = ({
  articles: defaultArticles = [],
  total,
  tag
}) => {
  const setting = useSetting();
  const [affix, setAffix] = useState(false);
  const [page, setPage] = useState(1);
  const [articles, setArticles] = useState<IArticle[]>(defaultArticles);

  useEffect(() => {
    const handler = () => {
      const y = (window as any).scrollY;
      setAffix(y > 100);
    };

    document.addEventListener("scroll", handler);

    return () => {
      document.removeEventListener("scroll", handler);
    };
  }, []);

  useEffect(() => {
    setArticles(defaultArticles);
  }, [defaultArticles]);

  const getArticles = useCallback(page => {
    ArticleProvider.getArticlesByTag(tag, {
      page,
      pageSize,
      status: "publish"
    }).then(res => {
      setPage(page);
      setArticles(articles => [...articles, ...res[0]]);
    });
  }, []);

  return (
    <Layout needFooter={false}>
      <CategoryMenu />
      <div className={cls("container", style.container)}>
        <div className={style.content}>
          <InfiniteScroll
            pageStart={1}
            loadMore={getArticles}
            hasMore={page * pageSize < total}
            loader={
              <div className={style.loading} key={0}>
                正在获取文章...
              </div>
            }
          >
            <ArticleList articles={articles} />
          </InfiniteScroll>

          <aside className={cls(style.aside)}>
            <div className={cls(affix ? style.isFixed : false)}>
              <RecommendArticles mode="inline" />
              <Tags />
              <Footer className={style.footer} setting={setting} />
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

// 服务端预取数据
Home.getInitialProps = async ctx => {
  const { tag } = ctx.query;
  const [articles] = await Promise.all([
    ArticleProvider.getArticlesByTag(tag, {
      page: 1,
      pageSize: 8,
      status: "publish"
    })
  ]);
  return { articles: articles[0], total: articles[1], tag: "" + tag };
};

export default Home;
