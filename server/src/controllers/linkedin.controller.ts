import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export const createLinkedinPost = async (userId: string, data: string, time: string) => {

  await prisma.linkedinPost.create({
    data: {
      userId: parseInt(userId),
      postContent: data,
      postTime: time,
    },
  })

}

export const updateLinkedinPost = async (postId: string, data: string, time: string) => {

  await prisma.linkedinPost.update({
    where: {
      id: parseInt(postId)
    },
    data: {
      postContent: data,
      postTime: time,
    }
  })
}

export const deleteLinkedinPost = async (postId: string) => {

  await prisma.linkedinPost.delete({
    where: {
      id: parseInt(postId),
    }
  })
}

export const searchLinkedinPost = async (userId: string, query: string) => {
  const posts = await prisma.linkedinPost.findMany({
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

export const getAllLinkedinPosts = async (userId: string) => {
  const allPosts = await prisma.linkedinPost.findMany({
    where: {
      userId: parseInt(userId),
    }
  })
  return allPosts;
}
