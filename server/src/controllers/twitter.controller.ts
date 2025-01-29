import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export const createTwitterPost = async (userId: string, data: string, time: string) => {

  await prisma.twitterPost.create({
    data: {
      userId: parseInt(userId),
      postContent: data,
      postTime: time,
    },
  })

}

export const updateTwitterPost = async (postId: string, data: string, time: string) => {

  await prisma.twitterPost.update({
    where: {
      id: parseInt(postId)
    },
    data: {
      postContent: data,
      postTime: time,
    }
  })
}

export const deleteTwitterPost = async (postId: string) => {

  await prisma.twitterPost.delete({
    where: {
      id: parseInt(postId),
    }
  })
}

export const searchTwitterPost = async (userId: string, query: string) => {
  const posts = await prisma.twitterPost.findMany({
    where: {
      userId: parseInt(userId),
      postContent: {
        contains: query,
        mode: "insensitive"
      },
    }
  })
  return posts;
}

export const getAllTwitterPosts = async (userId: string) => {
  const allPosts = await prisma.twitterPost.findMany({
    where: {
      userId: parseInt(userId),
    }
  })
  return allPosts;
}
