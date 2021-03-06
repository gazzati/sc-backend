import express, { Request, Response} from 'express'

import User from '../model/Profile'
import { verify } from '../middleware/verify-token'
import {UserType} from "../types/user"

const router = express.Router()

//USERS
router.get('/', async (req: Request, res: Response) => {
    const {page = 1, limit = 7, term} = req.query
    const searchFilter = {$regex: term ? `${term}` : '.*', $options: 'i'}
    const searchQuery = {
        $or: [
            {
                'info.name': searchFilter
            },
            {
                'info.surname': searchFilter
            }
        ]
    }

    const allUsers = await User.find(searchQuery)

    await User
        .find(searchQuery)
        .sort({date: -1})
        .limit(+limit)
        .skip((+page - 1) * +limit)
        .exec((err: any, doc: any) => {
            if(err) return res.send({resultCode: 1, message: err})

            res.send({
                resultCode: 0,
                message: 'OK',
                data: {
                    total: allUsers.length,
                    users: doc
                }

            })
        })
})

//FOLLOW
router.post('/follow:id', verify, async (req: Request, res: Response) => {
    const id = req.userId
    const followId = req.params.id

    const followUser = await User.findById(followId) as UserType
    id && followUser.followers.push(id)
    await followUser.save()

    const currentUser = await User.findById(id) as UserType
    currentUser.following.push(followId)
    currentUser.save()

    res.send({
        resultCode: 0,
        message: 'Follow success',
        data: {
            myId: id,
            userId: followId
        }
    })
})

//UNFOLLOW
router.delete('/unfollow:id', verify, async (req: Request, res: Response) => {
    const id = req.userId
    const unfollowId = req.params.id

    const unfollowUser = await User.findById(unfollowId) as UserType
    unfollowUser.followers = unfollowUser.followers.filter((followerId: any) => followerId.toString() !== id)
    await unfollowUser.save()

    const currentUser = await User.findById(id) as UserType
    currentUser.following = currentUser.following.filter((followerId: any) => followerId.toString() !== unfollowId)
    await currentUser.save()

    res.send({
        resultCode: 0,
        message: 'Unfollow success',
        data: {
            myId: id,
            userId: unfollowId
        }
    })
})

//FOLLOWING
router.get('/following', verify, async (req: Request, res: Response) => {
    const id = req.userId
    const currentUser = await User.findById(id) as UserType
    const following = []

    for (const followingId of currentUser.following) {
        const followingUser = await User.findById(followingId)
        following.push(followingUser)
    }

    res.send({
        resultCode: 0,
        message: 'OK',
        data: following
    })
})

//FOLLOWERS
router.get('/followers', verify, async (req: Request, res: Response) => {
    const id = req.userId
    const currentUser = await User.findById(id) as UserType
    const followers = []

    for (const followerId of currentUser.followers) {
        const follower = await User.findById(followerId)
        followers.push(follower)
    }

    res.send({
        resultCode: 0,
        message: 'OK',
        data: followers
    })
})

export default router
