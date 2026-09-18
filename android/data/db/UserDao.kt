package com.rescom.data.db

import androidx.room.*
import com.rescom.domain.model.User

// ─── Room Entity ─────────────────────────────────────────────────────────────

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val userId: String,
    val username: String,
    val displayName: String,
    val department: String,
    val semester: String,
    val deviceId: String,
    val publicKey: String,
    val privateKey: String,
    val createdAt: Long,
    val avatarSeed: Int,
)

// ─── DAO ─────────────────────────────────────────────────────────────────────

@Dao
interface UserDao {
    @Query("SELECT * FROM users LIMIT 1")
    suspend fun getLocalUser(): UserEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)

    @Query("UPDATE users SET displayName = :name, department = :dept, semester = :sem WHERE userId = :id")
    suspend fun updateProfile(id: String, name: String, dept: String, sem: String)

    @Query("SELECT COUNT(*) FROM users")
    suspend fun count(): Int
}

// ─── Mapper extensions ────────────────────────────────────────────────────────

fun UserEntity.toDomain(): User = User(
    userId = userId,
    username = username,
    displayName = displayName,
    department = department,
    semester = semester,
    deviceId = deviceId,
    publicKey = publicKey,
    privateKey = privateKey,
    createdAt = createdAt,
    avatarSeed = avatarSeed,
)

fun User.toEntity(): UserEntity = UserEntity(
    userId = userId,
    username = username,
    displayName = displayName,
    department = department,
    semester = semester,
    deviceId = deviceId,
    publicKey = publicKey,
    privateKey = privateKey,
    createdAt = createdAt,
    avatarSeed = avatarSeed,
)
